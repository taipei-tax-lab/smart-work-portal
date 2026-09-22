# TAX 小幫手動畫 V2 實驗

Branch: `experiment/mascot-animation-v2`

## 目標

淘汰 V1 的「整張 PNG 旋轉／位移」方式，改成真正的角色姿勢動畫。

V2 第一版預定 8 個關鍵姿勢：

1. 待機
2. 蓄力
3. 抬手
4. 向左大幅揮手
5. 向右大幅揮手
6. 再揮一次，披風延遲跟隨
7. 小跳
8. 回到待機

## 素材路徑

預計放在：

```
assets/mascot-v2/
  pose-01.png
  pose-02.png
  pose-03.png
  pose-04.png
  pose-05.png
  pose-06.png
  pose-07.png
  pose-08.png
```

測試頁：

```
lab/mascot-v2-test.html
```

頁面在素材尚未完成時會自動以 `tax-helper.png` 備援，不會出現破圖。

## 品質原則

- 不使用整張圖片大幅 rotate 來假裝揮手。
- 手掌角度與手臂姿勢必須真的改變。
- 身體重心要跟著揮手移動。
- 披風採延遲跟隨，避免皮影戲感。
- 最終若關鍵姿勢方向正確，再補中間幀並輸出 Animated WebP。
