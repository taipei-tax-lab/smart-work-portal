/**
 * Tax智慧通 - 本機混合式搜尋 v4（無 AI）
 *
 * 2026-08-17：在 v3 基礎上加入「身分／對象條件」與「一般繳納方式」判斷。
 * 主要新增：
 * - 熱門顯示名稱（popularTitle / 熱門顯示名稱）納入高權重搜尋
 * - 短查詢精準命中加權
 * - 特殊限定條件未出現在查詢時的降權
 * - 業務口語提示 businessHints
 * - strict / soft topic
 * - 保留 aliases / intent / fuzzy / coverage
 */
window.TaxSearch = (() => {
  const dictionary = window.TaxSearchDictionary || {
    aliasGroups: [], intentGroups: [], topicGroups: [], conditionGroups: [], intentProfiles: [], modifierGroups: [], businessHints: []
  };

  const norm = (s) => String(s || '')
    .toLowerCase()
    .replace(/[\s\u3000，。？！、；：,.!?()（）【】\[\]「」『』“”‘’《》〈〉<>\-_/\\]/g, '');

  const uniq = (arr) => [...new Set((arr || []).filter(Boolean))];
  const arr = (v) => Array.isArray(v) ? v : (v == null || v === '' ? [] : [v]);

  // 「有／無」在稅務語境常具實質意義，因此不再列 stop word。
  const stopWords = [
    '請問', '想問', '我想問', '我要', '我想', '請教', '麻煩', '一下',
    '的', '了', '呢', '嗎', '啊', '呀', '喔', '請', '要'
  ].map(norm);

  function fieldText(item) {
    const summary = item.summary ?? item['重點摘要'] ?? '';
    const popularTitle = item.popularTitle ?? item['熱門顯示名稱'] ?? '';
    const keywordsArray = arr(item.keywords);
    const aliasesArray = arr(item.aliases);
    return {
      question: norm(item.question),
      summary: norm(summary),
      popularTitle: norm(popularTitle),
      keywords: norm(keywordsArray.join(' ')),
      aliases: norm(aliasesArray.join(' ')),
      keywordItems: keywordsArray.map(norm).filter(Boolean),
      aliasItems: aliasesArray.map(norm).filter(Boolean),
      intents: arr(item.intent).map(norm),
      answer: norm(item.answer),
      legal: norm(item.legalBasis ?? item['法規依據'] ?? ''),
      category: norm(item.category)
    };
  }

  function containsAny(text, variants) {
    return uniq(variants).map(norm).filter(Boolean).some(v => text.includes(v));
  }

  function makeGroups() {
    const aliasGroups = arr(dictionary.aliasGroups).map(g => ({
      canonical: g.canonical,
      variants: uniq([g.canonical, ...arr(g.aliases)])
    }));
    const intentGroups = arr(dictionary.intentGroups).map(g => ({
      canonical: g.intent,
      variants: uniq([g.intent, ...arr(g.triggers)])
    }));
    const topicGroups = arr(dictionary.topicGroups).map(g => ({
      canonical: g.canonical,
      aliases: uniq([g.canonical, ...arr(g.aliases)]),
      strict: g.strict !== false
    }));
    return { aliasGroups, intentGroups, topicGroups };
  }

  const groups = makeGroups();

  function matchedTopics(queryNorm) {
    const candidates = [];
    groups.topicGroups.forEach(group => {
      const hit = group.aliases
        .map(raw => ({ raw, n: norm(raw) }))
        .filter(x => x.n && queryNorm.includes(x.n))
        .sort((a, b) => b.n.length - a.n.length)[0];
      if (hit) candidates.push({ ...group, matchedAlias: hit.raw, _len: hit.n.length });
    });

    candidates.sort((a, b) => b._len - a._len);
    const out = [];
    candidates.forEach(group => {
      const c = norm(group.canonical);
      const redundant = out.some(existing => {
        const e = norm(existing.canonical);
        return e.includes(c) && e !== c && existing.strict === group.strict;
      });
      if (!redundant) out.push(group);
    });
    return out;
  }

  function matchedNamedGroups(queryNorm, list) {
    return list.filter(group => group.variants.some(v => {
      const n = norm(v);
      return n && queryNorm.includes(n);
    }));
  }

  function removeKnownPhrases(queryNorm, topics, aliasMatches, intentMatches) {
    let rest = queryNorm;
    const phrases = [];
    topics.forEach(g => g.aliases.forEach(x => phrases.push(norm(x))));
    aliasMatches.forEach(g => g.variants.forEach(x => phrases.push(norm(x))));
    intentMatches.forEach(g => g.variants.forEach(x => phrases.push(norm(x))));
    stopWords.forEach(x => phrases.push(x));
    uniq(phrases).sort((a, b) => b.length - a.length).forEach(p => {
      if (p && rest.includes(p)) rest = rest.split(p).join('');
    });
    return rest;
  }

  function residualNgrams(rest) {
    if (!rest || rest.length < 2) return [];
    const grams = [];
    const maxLen = Math.min(5, rest.length);
    for (let len = maxLen; len >= 2; len--) {
      for (let i = 0; i <= rest.length - len; i++) {
        const g = rest.slice(i, i + len);
        if (!stopWords.includes(g)) grams.push(g);
      }
    }
    return uniq(grams).slice(0, 24);
  }

  function conceptMatch(fields, variants, includeIntent = false) {
    const v = uniq(variants).map(norm).filter(Boolean);
    const m = {
      question: containsAny(fields.question, v),
      popularTitle: containsAny(fields.popularTitle, v),
      keywords: containsAny(fields.keywords, v),
      aliases: containsAny(fields.aliases, v),
      summary: containsAny(fields.summary, v),
      answer: containsAny(fields.answer, v),
      legal: containsAny(fields.legal, v),
      category: containsAny(fields.category, v),
      intent: false
    };
    if (includeIntent) m.intent = fields.intents.some(x => v.includes(x));
    return m;
  }

  function weightedMatch(match, weights) {
    let s = 0;
    Object.keys(weights).forEach(k => { if (match[k]) s += weights[k] || 0; });
    return s;
  }

  function bigrams(s) {
    const n = norm(s);
    if (n.length < 2) return n ? [n] : [];
    const out = [];
    for (let i = 0; i < n.length - 1; i++) out.push(n.slice(i, i + 2));
    return out;
  }

  function diceSimilarity(a, b) {
    const aa = bigrams(a), bb = bigrams(b);
    if (!aa.length || !bb.length) return 0;
    const counts = new Map();
    bb.forEach(x => counts.set(x, (counts.get(x) || 0) + 1));
    let hit = 0;
    aa.forEach(x => {
      const c = counts.get(x) || 0;
      if (c > 0) { hit++; counts.set(x, c - 1); }
    });
    return (2 * hit) / (aa.length + bb.length);
  }

  function queryBigramCoverage(query, candidate) {
    const q = uniq(bigrams(query));
    if (!q.length) return 0;
    const c = new Set(bigrams(candidate));
    return q.filter(x => c.has(x)).length / q.length;
  }

  function candidateIntentScore(fields, queryIntents) {
    if (!queryIntents.length) return 0;
    let s = 0;
    const itemIntents = new Set(fields.intents);
    const queryNames = new Set(queryIntents.map(g => norm(g.canonical)));

    queryNames.forEach(n => {
      if (itemIntents.has(n)) s += 76;
    });

    const apply = norm('申請');
    const repeat = norm('重複申請');
    const docs = norm('文件');
    const notice = norm('通知');
    const definition = norm('定義');
    const qualification = norm('資格');

    if (queryNames.has(apply) && !queryNames.has(repeat)) {
      if (itemIntents.has(repeat)) s -= 190;
      if (itemIntents.has(docs)) s += 78;
      if (itemIntents.has(notice) && !itemIntents.has(docs)) s -= 38;
      if (itemIntents.has(definition) && !itemIntents.has(docs)) s -= 28;
      if (itemIntents.has(qualification) && !itemIntents.has(docs)) s -= 12;

      if (/^(如何申請|怎麼申請|如何申辦|怎麼申辦|如何辦理|我要申請|想要申請|申請)/.test(fields.question)) s += 118;
      if (/應準備|應備|哪些文件|什麼文件/.test(fields.question)) s += 38;
    }

    if (queryNames.has(repeat)) {
      if (itemIntents.has(repeat)) s += 145;
      else s -= 35;
    }

    const specific = [...queryNames].filter(x => x !== apply && x !== repeat);
    if (specific.length && specific.some(x => itemIntents.has(x))) s += 30;
    return s;
  }

  function shortQueryPrecision(fields, q) {
    let s = 0;
    const short = q.length <= 8;
    if (!short) return 0;

    // 人工設定的「熱門顯示名稱」其實很接近每題的短標籤。
    if (fields.popularTitle === q) s += 190;
    else if (fields.popularTitle && (fields.popularTitle.includes(q) || q.includes(fields.popularTitle))) s += 82;

    // 單一 keyword / alias 完全相等，比「長字串中剛好包含」可靠。
    if (fields.keywordItems.includes(q)) s += 135;
    if (fields.aliasItems.includes(q)) s += 72;

    // 題目直接含短查詢時，題目越精簡越加分。
    if (fields.question.includes(q)) {
      const extra = Math.max(0, fields.question.length - q.length);
      s += Math.max(10, 82 - Math.min(72, extra * 2));
    }
    return s;
  }

  function conditionAdjustment(fields, q) {
    let score = 0;
    let strictMatched = true;
    const primary = `${fields.question}${fields.popularTitle}${fields.keywords}${fields.aliases}${fields.summary}${fields.answer}`;

    arr(dictionary.conditionGroups).forEach(group => {
      const triggers = arr(group.triggers).map(norm).filter(Boolean);
      const queryHas = triggers.some(t => q.includes(t));
      if (!queryHas) return;

      const candidateTerms = arr(group.candidateTerms).map(norm).filter(Boolean);
      const candidateHas = candidateTerms.some(t => primary.includes(t));
      if (candidateHas) score += Number(group.boost || 0);
      else if (group.strict) strictMatched = false;
    });

    return { score, strictMatched };
  }

  function intentProfileAdjustment(fields, q) {
    let score = 0;
    // 正向線索可看題目／短標題／關鍵字／摘要；
    // 負向「特殊情境」只看題目／短標題，避免像綜合繳稅題因答案順帶提到分期而被誤扣分。
    const primary = `${fields.question}${fields.popularTitle}${fields.keywords}${fields.summary}`;
    const headline = `${fields.question}${fields.popularTitle}`;

    arr(dictionary.intentProfiles).forEach(profile => {
      const triggerHit = arr(profile.triggers).map(norm).filter(Boolean).some(t => q.includes(t));
      if (!triggerHit) return;

      const positives = arr(profile.positiveTerms).map(norm).filter(Boolean);
      const negatives = arr(profile.negativeTerms).map(norm).filter(Boolean);
      const posHits = positives.filter(t => primary.includes(t)).length;
      const negHits = negatives.filter(t => headline.includes(t)).length;

      if (posHits) score += Number(profile.positiveScore || 0) + Math.min(80, (posHits - 1) * 22);
      if (negHits) score -= Number(profile.negativePenalty || 0) + Math.min(90, (negHits - 1) * 28);
    });

    return score;
  }

  function modifierPenalty(fields, q) {
    let penalty = 0;
    const candidatePrimary = `${fields.question}${fields.popularTitle}${fields.keywords}`;
    arr(dictionary.modifierGroups).forEach(group => {
      const terms = arr(group.terms).map(norm).filter(Boolean);
      if (!terms.length) return;
      const candidateHas = terms.some(t => candidatePrimary.includes(t));
      const queryHas = terms.some(t => q.includes(t));
      if (candidateHas && !queryHas) penalty += Number(group.penalty || 0);
    });
    return penalty;
  }

  function businessHintScore(fields, q) {
    let s = 0;
    const primary = `${fields.question}${fields.popularTitle}${fields.keywords}${fields.summary}`;
    arr(dictionary.businessHints).forEach(hint => {
      const triggerHit = arr(hint.triggers).some(t => {
        const n = norm(t);
        return n && q.includes(n);
      });
      if (!triggerHit) return;
      arr(hint.boosts).forEach(boost => {
        const hit = arr(boost.terms).some(t => {
          const n = norm(t);
          return n && primary.includes(n);
        });
        if (hit) s += Number(boost.score || 0);
      });
    });
    return s;
  }

  function score(item, rawQuery) {
    const q = norm(rawQuery);
    if (!q) return { score: 0, strictTopicHit: true, coverage: 0 };

    const fields = fieldText(item);
    const topics = matchedTopics(q);
    const aliasMatches = matchedNamedGroups(q, groups.aliasGroups);
    const intentMatches = matchedNamedGroups(q, groups.intentGroups);
    const rest = removeKnownPhrases(q, topics, aliasMatches, intentMatches);
    const residuals = residualNgrams(rest);

    let s = 0;
    let matchedConcepts = 0;
    let totalConcepts = 0;

    // A. 完整片語命中。
    if (fields.question.includes(q)) s += 132;
    if (fields.popularTitle.includes(q) && q.length >= 2) s += 105;
    if (fields.keywords.includes(q)) s += 86;
    if (fields.aliases.includes(q)) s += 58; // v3 降低過度擴張 aliases 的影響
    if (fields.summary.includes(q)) s += 70;
    if (fields.answer.includes(q)) s += 20;

    s += shortQueryPrecision(fields, q);

    // B. 專業主題。
    let strictTopicTotal = 0;
    let strictTopicHitCount = 0;
    topics.forEach(topic => {
      totalConcepts++;
      const m = conceptMatch(fields, topic.aliases);
      const hit = m.question || m.popularTitle || m.keywords || m.aliases || m.summary || m.category;
      if (hit) matchedConcepts++;
      if (topic.strict) {
        strictTopicTotal++;
        if (hit) strictTopicHitCount++;
      }
      s += weightedMatch(m, {
        question: 106,
        popularTitle: 112,
        keywords: 86,
        aliases: 52,
        summary: 68,
        category: 52,
        answer: 18,
        legal: 5
      });
      if (!topic.strict && hit) s += 28;
    });

    // C. 意圖。
    s += candidateIntentScore(fields, intentMatches);
    intentMatches.forEach(group => {
      totalConcepts++;
      const m = conceptMatch(fields, group.variants, true);
      const hit = m.intent || m.question || m.popularTitle || m.keywords || m.aliases || m.summary;
      if (hit) matchedConcepts++;
      s += weightedMatch(m, {
        intent: 90,
        question: 46,
        popularTitle: 48,
        keywords: 31,
        aliases: 18,
        summary: 29,
        answer: 7
      });
    });

    // D. 全域同義詞／口語詞。
    aliasMatches.forEach(group => {
      totalConcepts++;
      const m = conceptMatch(fields, group.variants);
      const hit = m.question || m.popularTitle || m.keywords || m.aliases || m.summary || m.category;
      if (hit) matchedConcepts++;
      s += weightedMatch(m, {
        question: 38,
        popularTitle: 46,
        keywords: 34,
        aliases: 22,
        summary: 24,
        category: 12,
        answer: 6
      });
    });

    // E. 題目自身 aliases 對原查詢直接命中；v3 降低權重，避免廣義 aliases 霸榜。
    fields.aliasItems.forEach(a => {
      if (a && q.includes(a)) s += Math.min(18, 5 + a.length * 1.5);
    });

    // F. 未辨識剩餘片段。
    let residualHit = false;
    residuals.forEach(term => {
      const m = conceptMatch(fields, [term]);
      if (m.question || m.popularTitle || m.keywords || m.aliases || m.summary) residualHit = true;
      s += weightedMatch(m, {
        question: 9,
        popularTitle: 10,
        keywords: 7,
        aliases: 3,
        summary: 5,
        answer: 1
      });
    });
    if (residuals.length) {
      totalConcepts++;
      if (residualHit) matchedConcepts++;
    }

    // G. 概念涵蓋率。
    const coverage = totalConcepts ? matchedConcepts / totalConcepts : 0;
    s += Math.round(coverage * 62);
    if (totalConcepts >= 2 && coverage === 1) s += 28;

    // H. strict topic 未命中才強降權；soft topic 只靠分數差排序。
    const strictTopicHit = strictTopicTotal === 0 || strictTopicHitCount === strictTopicTotal;
    if (!strictTopicHit) s *= 0.055;

    // I. v4：身分／對象是高辨識力條件。查詢明確提到時，候選也應命中。
    const condition = conditionAdjustment(fields, q);
    s += condition.score;
    if (!condition.strictMatched) s *= 0.035;

    // J. v4：細分一般繳納方式，降低分期／延期／證明等特殊情境。
    s += intentProfileAdjustment(fields, q);

    // K. 查詢沒有提及候選的特殊限定條件時降權。
    s -= modifierPenalty(fields, q);

    // L. 依實際同仁用語加入「概念級」業務提示。
    s += businessHintScore(fields, q);

    // M. 模糊比對只作小幅補助。
    const primaryText = `${fields.question}${fields.popularTitle}${fields.summary}${fields.keywords}${fields.aliases}`;
    const qCoverage = queryBigramCoverage(q, primaryText);
    const dice = diceSimilarity(q, fields.question);
    if (qCoverage >= 0.8) s += 17;
    else if (qCoverage >= 0.65) s += 9;
    else if (qCoverage >= 0.5) s += 4;
    if (dice >= 0.55) s += 6;

    return {
      score: Math.round(Math.max(0, s) * 100) / 100,
      strictTopicHit,
      coverage
    };
  }

  function search(bank, q, category = '全部') {
    const list = Array.isArray(bank) ? bank : [];
    const filtered = category === '全部' ? list : list.filter(x => x.category === category);
    const raw = String(q || '').trim();
    if (!raw) return filtered.map(x => ({ ...x, _score: 0 }));

    const explicitStrictTopic = matchedTopics(norm(raw)).some(t => t.strict);

    return filtered
      .map(item => {
        const detail = score(item, raw);
        return { ...item, _score: detail.score, _strictTopicHit: detail.strictTopicHit };
      })
      .filter(x => (!explicitStrictTopic || x._strictTopicHit) && x._score >= 10)
      .sort((a, b) => b._score - a._score || Number(a.id || 0) - Number(b.id || 0))
      .map(({ _strictTopicHit, ...item }) => item);
  }

  return {
    search,
    norm,
    dictionaryVersion: dictionary.version || 'unknown'
  };
})();
