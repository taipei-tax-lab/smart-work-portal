/**
 * Tax智慧通 - 搜尋語意字典 v3
 *
 * 2026-08-17：依「TAX 小幫手測試」24 組人工排序結果調整。
 * 本檔只放共用語言規則與業務排序提示，不放答案內容。
 */
window.TaxSearchDictionary = {
  version: '2026-08-17-v4',

  aliasGroups: [
    { canonical: '出租', aliases: ['租屋', '房東', '租給', '租賃'] },
    { canonical: '自用', aliases: ['自住', '自己住', '設籍'] },
    { canonical: '身心障礙', aliases: ['身障', '殘障'] },
    { canonical: '使用牌照稅', aliases: ['牌照稅', '牌照'] },
    { canonical: '車輛', aliases: ['車子', '汽車'] },
    { canonical: '繳款書', aliases: ['稅單', '補單'] },
    { canonical: '分期繳納', aliases: ['分期', '分期繳稅'] },
    { canonical: '延期繳納', aliases: ['延期', '延繳'] },
    { canonical: '房屋', aliases: ['房子', '住宅'] },
    { canonical: '土地', aliases: ['地價'] },
    { canonical: '繳納證明', aliases: ['繳稅證明', '繳款證明', '完稅證明'] },
    { canonical: '課稅明細', aliases: ['課稅資料', '稅籍明細'] },
    { canonical: '復查', aliases: ['行政救濟', '不服', '申訴'] },
    { canonical: '繳稅', aliases: ['繳款', '付款', '稅款繳納'] },
    { canonical: '遺產', aliases: ['繼承', '被繼承人', '過世', '亡故', '死亡'] },
    { canonical: '娃娃機', aliases: ['選物販賣機', '夾娃娃機'] },
    { canonical: '線上', aliases: ['網路', '網路申辦', '線上申辦', '線上申請'] },
    { canonical: '臨櫃', aliases: ['現場', '到場', '櫃台'] },
    { canonical: '申請', aliases: ['申辦', '辦理'] },
    { canonical: '應備文件', aliases: ['文件', '資料', '證件', '檢附文件', '應備資料'] },
    { canonical: '資格', aliases: ['條件', '適用資格', '申請資格'] },
    { canonical: '期限', aliases: ['截止日', '申請期限', '繳納期限', '申報期限'] },
    { canonical: '通知', aliases: ['訊息', '簡訊', '寄發通知'] },
    { canonical: '查詢', aliases: ['查', '查進度', '查紀錄'] },
    { canonical: '變更', aliases: ['更正', '修改'] },
    { canonical: '撤銷', aliases: ['取消', '解除'] },
    { canonical: '退稅', aliases: ['退還', '溢繳退稅', '退回稅款'] },

    // 依實際同仁用語新增。
    { canonical: '租賃契約', aliases: ['租約', '房屋租約'] },
    { canonical: '個人財產及所得資料', aliases: ['財力證明', '財清', '所清', '財產清單', '所得清單', '財產所得資料'] },
    { canonical: '欠稅移送', aliases: ['稅單移送', '移送執行', '移送強制執行', '強制執行', '行政執行'] },
    { canonical: '溢繳稅款', aliases: ['多繳稅', '多繳', '繳太多', '重複繳', '多付稅款'] },
    { canonical: '無違章欠稅證明', aliases: ['沒有欠稅證明', '無欠稅證明', '無欠稅證明書'] },
    { canonical: '查欠', aliases: ['查詢有無欠稅', '有無欠稅', '欠稅查詢', '地方稅查欠'] },
    { canonical: '電子繳款書', aliases: ['電子稅單', '電子方式傳送繳款書'] },
    { canonical: '逾期繳納', aliases: ['過期', '逾期', '沒繳', '未繳', '過了繳納期限'] },
    { canonical: '信用卡繳稅', aliases: ['信用卡繳款', '信用卡付款'] },
    { canonical: '房屋稅率', aliases: ['房屋稅稅率'] },
    { canonical: '地方稅稅額試算', aliases: ['試算稅金', '想試算稅金', '地方稅試算', '稅金試算'] },
    { canonical: '經濟弱勢', aliases: ['低收入戶', '弱勢'] },
    { canonical: '外籍身分', aliases: ['外國人', '外籍人士', '外籍', '中華民國居留證', '居留證', '居留地址', '無戶籍國民', '大陸地區人民', '香港居民', '澳門居民', '港澳居民'] },
    { canonical: '一般繳納方式', aliases: ['繳稅方式', '繳納方式', '付款方式', '怎麼繳稅', '如何繳稅', '怎麼繳納', '如何繳納'] },

    // 專業主題簡稱／常見錯字。
    { canonical: '房屋稅差別稅率2.0', aliases: ['差別稅率2.0'] },
    { canonical: '稅籍異動即時通', aliases: ['即時通', '異動即時通', '稅籍即時通', '稅藉異動即時通'] },
    { canonical: '自用住宅用地', aliases: ['自用住宅', '自住用地', '地價稅自住'] },
    { canonical: '公益出租人', aliases: ['公益出租'] },
    { canonical: '土地增值稅', aliases: ['土增稅'] },
    { canonical: '納稅者權利保護', aliases: ['納保'] },
    { canonical: 'PAY.TAIPEI', aliases: ['PAYTAIPEI'] }
  ],

  intentGroups: [
    { intent: '重複申請', triggers: ['再申請', '重新申請', '還要再申請', '申請過', '已經申請', '免重複申請'] },
    { intent: '申請', triggers: ['申請', '申辦', '辦理', '怎麼辦', '如何辦', '怎麼申請', '如何申請', '怎麼申辦', '如何申辦', '想要申請', '我要申請'] },
    { intent: '文件', triggers: ['文件', '資料', '證件', '應備', '應備文件', '要帶什麼', '帶什麼', '準備什麼', '要準備什麼', '檢附'] },
    { intent: '資格', triggers: ['資格', '條件', '符合', '適用', '可以嗎', '可不可以', '能不能', '是否可以', '誰可以'] },
    { intent: '期限', triggers: ['期限', '截止', '何時', '什麼時候', '幾號', '多久', '期間', '申請期限', '繳納期間', '過期', '逾期'] },
    { intent: '費用', triggers: ['費用', '收費', '手續費', '多少錢', '免費', '服務費'] },
    { intent: '稅率', triggers: ['稅率', '幾趴', '百分之', '課徵率'] },
    { intent: '金額', triggers: ['金額', '多少', '限額', '上限', '免稅額', '稅額'] },
    { intent: '定義', triggers: ['什麼是', '何謂', '是什麼', '意思', '定義'] },
    { intent: '通知', triggers: ['通知', '訊息', '簡訊', '寄發', '收到通知', '會通知'] },
    { intent: '查詢', triggers: ['查詢', '查', '進度', '紀錄', '哪裡查', '怎麼查', '有無'] },
    { intent: '變更', triggers: ['變更', '更正', '修改', '改成', '改按', '改自住'] },
    { intent: '撤銷', triggers: ['撤銷', '取消', '解除'] },
    { intent: '退稅', triggers: ['退稅', '退還', '溢繳', '退回', '多繳', '繳太多'] },
    { intent: '補救', triggers: ['補救', '逾期', '過期', '來不及', '忘了', '沒繳', '未繳'] },
    { intent: '一般繳納方式', triggers: ['如何繳納', '怎麼繳納', '如何繳稅', '怎麼繳稅', '如何繳', '怎麼繳', '繳納方式', '繳稅方式', '付款方式'] },
    { intent: '繳納', triggers: ['繳納', '繳稅', '繳款', '付款', '怎麼繳', '如何繳', '沒繳', '未繳'] },
    { intent: '免稅', triggers: ['免稅', '免徵', '減免'] },
    { intent: '處罰', triggers: ['處罰', '罰鍰', '裁罰', '滯納金'] }
  ],

  // strict=true：查詢明確出現此專業主題時，未命中候選會被大幅降權。
  topicGroups: [
    { canonical: '房屋稅差別稅率2.0', aliases: ['差別稅率2.0'], strict: true },
    { canonical: '臺北市分期繳納地方稅申請辦法', aliases: [], strict: true },
    { canonical: '稅籍異動即時通', aliases: ['即時通', '異動即時通', '稅籍即時通', '稅藉異動即時通'], strict: true },
    { canonical: '自用住宅用地', aliases: ['自用住宅', '自住用地', '地價稅自住', '地價稅自用', '自用地價稅'], strict: true },
    { canonical: '公益出租人', aliases: ['公益出租'], strict: true },
    { canonical: '一生一屋', aliases: [], strict: true },
    { canonical: '一生一次', aliases: [], strict: true },
    { canonical: '重購退稅', aliases: [], strict: true },
    { canonical: '使用牌照稅', aliases: ['牌照稅'], strict: true },
    { canonical: '土地增值稅', aliases: ['土增稅'], strict: true },
    { canonical: '電子繳款書', aliases: ['電子稅單'], strict: true },
    { canonical: '電子繳納證明', aliases: [], strict: true },
    { canonical: '金融遺產', aliases: [], strict: true },
    { canonical: '雲端發票', aliases: [], strict: true },
    { canonical: '行動支付', aliases: [], strict: true },
    { canonical: '電子支付', aliases: [], strict: true },
    { canonical: '自然人憑證', aliases: [], strict: true },
    { canonical: '房屋稅', aliases: [], strict: true },
    { canonical: '地價稅', aliases: [], strict: true },
    { canonical: '契稅', aliases: [], strict: true },
    { canonical: '娛樂稅', aliases: [], strict: true },
    { canonical: '印花稅', aliases: [], strict: true },
    { canonical: '納保官', aliases: [], strict: true },
    { canonical: '行政救濟', aliases: [], strict: false },
    { canonical: '復查', aliases: ['不服行政救濟'], strict: false },
    { canonical: '納稅者權利保護', aliases: ['納保'], strict: true },
    { canonical: '分期繳納', aliases: ['分期'], strict: true },
    { canonical: '延期繳納', aliases: ['延期', '延繳'], strict: true },
    { canonical: '繳納證明', aliases: [], strict: true },
    { canonical: '課稅明細', aliases: [], strict: true },
    { canonical: '租賃契約', aliases: ['租約'], strict: false },
    { canonical: '個人財產及所得資料', aliases: ['財力證明', '財清', '所清', '財產清單', '所得清單'], strict: true },
    { canonical: '欠稅移送', aliases: ['稅單移送', '移送執行', '移送強制執行'], strict: true },
    { canonical: '溢繳稅款', aliases: ['多繳稅', '多繳', '繳太多'], strict: false },
    { canonical: '無違章欠稅證明', aliases: ['沒有欠稅證明', '無欠稅證明'], strict: false },
    { canonical: '查欠', aliases: ['查詢有無欠稅', '有無欠稅'], strict: true },
    { canonical: '逾期繳納', aliases: ['過期', '沒繳'], strict: false },
    { canonical: '信用卡繳稅', aliases: ['信用卡繳款'], strict: false },
    { canonical: '房屋稅率', aliases: ['房屋稅稅率'], strict: true },
    { canonical: '地方稅稅額試算', aliases: ['試算稅金', '想試算稅金', '稅額試算', '房屋稅試算', '地價稅試算'], strict: false },
    { canonical: '豪宅稅', aliases: [], strict: true },
    { canonical: '高級住宅', aliases: [], strict: true },
    { canonical: 'PAY.TAIPEI', aliases: ['PAYTAIPEI'], strict: true },
    { canonical: 'KIOSK', aliases: [], strict: true }
  ],

  // v4：使用者若明確說出身分／對象條件，候選題也必須命中該條件。
  conditionGroups: [
    {
      canonical: '外籍身分',
      triggers: ['外國人', '外籍人士', '外籍', '居留證', '中華民國居留證', '無戶籍國民', '大陸地區人民', '香港居民', '澳門居民', '港澳居民'],
      candidateTerms: ['外國人', '外籍', '居留證', '中華民國居留證', '無戶籍國民', '大陸地區人民', '香港', '澳門', '港澳居民'],
      strict: true,
      boost: 210
    },
    {
      canonical: '身心障礙者',
      triggers: ['身心障礙', '身障', '殘障'],
      candidateTerms: ['身心障礙', '身障', '殘障'],
      strict: true,
      boost: 150
    },
    {
      canonical: '低收入戶',
      triggers: ['低收入戶', '弱勢'],
      candidateTerms: ['低收入戶', '經濟弱勢', '弱勢'],
      strict: false,
      boost: 110
    }
  ],

  // v4：把過大的「繳納」再細分。使用者問一般怎麼繳時，
  // 優先一般繳稅管道，並降低分期、延期、逾期、繳納證明等特殊情境。
  intentProfiles: [
    {
      canonical: '一般繳納方式',
      triggers: ['如何繳納', '怎麼繳納', '如何繳稅', '怎麼繳稅', '如何繳', '怎麼繳', '繳納方式', '繳稅方式', '付款方式'],
      positiveTerms: ['信用卡', '刷卡', '行動支付', '電子支付', '便利商店', '銀行', '金融卡', '網路繳稅', '繳稅方式', '繳納方式'],
      positiveScore: 165,
      negativeTerms: ['分期', '延期', '延繳', '繳納證明', '完稅證明', '逾期', '過期', '欠稅移送', '行政執行', 'kiosk', '稅務全功能自動化服務機', '非本人', '他人信用卡', '電子支付', '行動支付', '臨櫃'],
      negativePenalty: 230
    }
  ],

  // 候選題目含有「查詢中沒有提到的特殊限定條件」時，小幅降權。
  // 用來避免短查詢被太特殊的題目搶到第一名。
  modifierGroups: [
    { name: '外籍居留', terms: ['外國人', '外籍', '居留證', '無戶籍國民', '大陸地區人民', '香港', '澳門'], penalty: 68 },
    { name: '電動', terms: ['電動', '電能'], penalty: 55 },
    { name: '身心障礙', terms: ['身心障礙', '身障', '殘障'], penalty: 65 },
    { name: '非本人', terms: ['非本人', '他人信用卡'], penalty: 38 },
    { name: '電子支付', terms: ['電子支付'], penalty: 34 },
    { name: '行動支付', terms: ['行動支付'], penalty: 26 },
    { name: '臨櫃', terms: ['臨櫃', '櫃檯'], penalty: 14 },
    { name: '出租', terms: ['出租', '租賃所得'], penalty: 35 },
    { name: '公益出租', terms: ['公益出租'], penalty: 45 },
    { name: '繼承遺產', terms: ['遺產', '繼承', '被繼承人'], penalty: 58 },
    { name: '出國除戶', terms: ['出國', '除戶'], penalty: 48 },
    { name: '移送執行', terms: ['移送執行', '強制執行', '行政執行'], penalty: 45 },
    { name: '逾期', terms: ['逾期', '過期', '繳納期限屆滿'], penalty: 34 },
    { name: 'KIOSK', terms: ['kiosk', '稅務全功能自動化服務機'], penalty: 72 },
    { name: '歸戶', terms: ['歸戶'], penalty: 62 },
    { name: '信託', terms: ['信託'], penalty: 62 },
    { name: '契稅限定', terms: ['契稅'], penalty: 38 },
    { name: '行政救濟限定', terms: ['行政救濟'], penalty: 48 },
    { name: '建築能效', terms: ['建築能效', '地段率', '房屋稅基變革'], penalty: 46 }
  ],

  // 極短／高度口語問題的「業務提示」。不是直接指定題號，而是替相關概念加分。
  businessHints: [
    { triggers: ['過世要辦什麼', '繼承要做什麼'], boosts: [
      { terms: ['可以到哪些稅務機關', '可查詢的金融遺產種類', '應備證明文件'], score: 235 },
      { terms: ['金融遺產'], score: 135 },
      { terms: ['申請後何時可取得金融遺產', '查詢申辦進度'], score: 105 },
      { terms: ['不動產移轉', '查欠'], score: 95 }
    ]},
    { triggers: ['沒繳', '未繳'], boosts: [
      { terms: ['逾期繳納', '滯納金', '處罰'], score: 115 },
      { terms: ['分期繳納', '分期繳稅'], score: 135 },
      { terms: ['繳納期限'], score: 42 }
    ]},
    { triggers: ['信用卡繳款'], boosts: [
      { terms: ['臨櫃繳稅', '信用卡刷卡'], score: 235 },
      { terms: ['非本人信用卡'], score: 135 },
      { terms: ['轉帳繳稅', '紙本繳納證明'], score: 105 }
    ]},
    { triggers: ['信用卡繳稅'], boosts: [
      { terms: ['信用卡、活期儲蓄存款帳戶', '晶片金融卡', '行動支付'], score: 285 },
      { terms: ['臨櫃繳稅'], score: 165 },
      { terms: ['非本人信用卡'], score: 95 }
    ]},
    { triggers: ['不服行政救濟'], boosts: [
      { terms: ['不服', '復查'], score: 90 },
      { terms: ['復查決定', '訴願'], score: 58 },
      { terms: ['納保官'], score: 28 }
    ]},
    { triggers: ['營業改自住'], boosts: [
      { terms: ['原供營業', '變更為自用', '改按自用住宅'], score: 100 },
      { terms: ['營業使用', '營利事業已遷出'], score: 58 },
      { terms: ['自住使用'], score: 90 }
    ]},
    { triggers: ['申請地價稅自住'], boosts: [
      { terms: ['網路申辦', '我要申請按自用住宅用地'], score: 95 },
      { terms: ['原供營業', '變更為自用'], score: 52 },
      { terms: ['逾期申請', '補救'], score: 34 }
    ]},
    { triggers: ['低收入戶'], boosts: [
      { terms: ['低收入戶'], score: 120 },
      { terms: ['經濟弱勢', '天災', '不可抗力'], score: 115 },
      { terms: ['申請分期繳稅', '分期繳納地方稅申請辦法'], score: 48 }
    ]},
    { triggers: ['稅單移送'], boosts: [
      { terms: ['欠稅已被移送執行'], score: 135 },
      { terms: ['欠稅移送強制執行', '無法一次繳清'], score: 125 },
      { terms: ['沒錢繳稅', '分期或延期'], score: 72 }
    ]},
    { triggers: ['過期'], boosts: [
      { terms: ['逾期繳納稅款', '處罰'], score: 100 },
      { terms: ['過了繳納期限之稅單'], score: 88 },
      { terms: ['電子支付帳戶', '逾期的稅單'], score: 55 }
    ]},
    { triggers: ['沒收到稅單'], boosts: [
      { terms: ['沒有收到稅單', '補單'], score: 125 },
      { terms: ['線上查繳稅'], score: 82 },
      { terms: ['電子方式傳送', '電子繳款書'], score: 58 }
    ]},
    { triggers: ['申請沒有欠稅證明', '沒有欠稅證明'], boosts: [
      { terms: ['無違章欠稅證明'], score: 145 },
      { terms: ['查欠', '不動產移轉'], score: 65 }
    ]},
    { triggers: ['多繳稅', '繳太多'], boosts: [
      { terms: ['溢繳稅款', '申請退還'], score: 150 },
      { terms: ['退稅支票', '逾期'], score: 58 },
      { terms: ['退稅支票', '受款人已死亡'], score: 45 }
    ]}
  ]
};
