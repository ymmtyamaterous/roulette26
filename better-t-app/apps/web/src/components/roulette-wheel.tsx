import { Button } from "@better-t-app/ui/components/button";
import { Input } from "@better-t-app/ui/components/input";
import { useCallback, useEffect, useRef, useState } from "react";

interface RouletteItem {
  id: number;
  label: string;
  color: string;
}

const DEFAULT_COLORS = [
  "#FF6384",
  "#36A2EB",
  "#FFCE56",
  "#4BC0C0",
  "#9966FF",
  "#FF9F40",
  "#FF6384",
  "#C9CBCF",
];

const DEFAULT_ITEMS: RouletteItem[] = [
  { id: 1, label: "選択肢 1", color: DEFAULT_COLORS[0] },
  { id: 2, label: "選択肢 2", color: DEFAULT_COLORS[1] },
  { id: 3, label: "選択肢 3", color: DEFAULT_COLORS[2] },
  { id: 4, label: "選択肢 4", color: DEFAULT_COLORS[3] },
  { id: 5, label: "選択肢 5", color: DEFAULT_COLORS[4] },
  { id: 6, label: "選択肢 6", color: DEFAULT_COLORS[5] },
];

export function RouletteWheel() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [items, setItems] = useState<RouletteItem[]>(DEFAULT_ITEMS);
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentAngle, setCurrentAngle] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [newItemLabel, setNewItemLabel] = useState("");
  const nextIdRef = useRef(DEFAULT_ITEMS.length + 1);
  const animationRef = useRef<number | null>(null);
  const angleRef = useRef(0);

  const drawWheel = useCallback(
    (angle: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const size = canvas.width;
      const cx = size / 2;
      const cy = size / 2;
      const radius = size / 2 - 10;
      const sliceAngle = (2 * Math.PI) / items.length;

      ctx.clearRect(0, 0, size, size);

      // 各スライスを描画
      for (let i = 0; i < items.length; i++) {
        const startAngle = angle + i * sliceAngle;
        const endAngle = startAngle + sliceAngle;

        // スライス塗りつぶし
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = items[i].color;
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.stroke();

        // ラベルテキスト
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(startAngle + sliceAngle / 2);
        ctx.textAlign = "right";
        ctx.fillStyle = "#fff";
        ctx.font = `bold ${Math.max(10, Math.min(16, radius / items.length * 1.2))}px sans-serif`;
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.shadowBlur = 3;
        ctx.fillText(items[i].label, radius - 10, 5);
        ctx.restore();
      }

      // 中心円
      ctx.beginPath();
      ctx.arc(cx, cy, 18, 0, 2 * Math.PI);
      ctx.fillStyle = "#fff";
      ctx.fill();
      ctx.strokeStyle = "#ccc";
      ctx.lineWidth = 2;
      ctx.stroke();
    },
    [items],
  );

  // 矢印ポインターを描画
  const drawPointer = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = canvas.width;
    const cx = size / 2;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx - 14, 0);
    ctx.lineTo(cx + 14, 0);
    ctx.lineTo(cx, 36);
    ctx.closePath();
    ctx.fillStyle = "#ef4444";
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }, []);

  // キャンバス再描画
  useEffect(() => {
    drawWheel(currentAngle);
    drawPointer();
  }, [drawWheel, drawPointer, currentAngle, items]);

  const spin = useCallback(() => {
    if (isSpinning || items.length < 2) return;

    setIsSpinning(true);
    setResult(null);

    const extraSpins = 5 + Math.floor(Math.random() * 5); // 5〜9回転
    const randomOffset = Math.random() * 2 * Math.PI;
    const totalRotation = extraSpins * 2 * Math.PI + randomOffset;
    const duration = 4000 + Math.random() * 1500; // 4〜5.5秒

    const startAngle = angleRef.current;
    const targetAngle = startAngle + totalRotation;
    const startTime = performance.now();

    const easeOut = (t: number) => 1 - (1 - t) ** 3;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOut(progress);
      const angle = startAngle + totalRotation * easedProgress;

      angleRef.current = angle;
      setCurrentAngle(angle);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // 当選結果を計算
        const normalizedAngle = ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        const sliceAngle = (2 * Math.PI) / items.length;
        // ポインターは上部（-π/2）を指しているため調整
        const pointerAngle = (2 * Math.PI - normalizedAngle + (3 * Math.PI) / 2) % (2 * Math.PI);
        const winIndex = Math.floor(pointerAngle / sliceAngle) % items.length;
        setResult(items[winIndex].label);
        setIsSpinning(false);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  }, [isSpinning, items]);

  const addItem = useCallback(() => {
    const label = newItemLabel.trim();
    if (!label) return;
    const colorIndex = nextIdRef.current % DEFAULT_COLORS.length;
    setItems((prev) => [
      ...prev,
      { id: nextIdRef.current, label, color: DEFAULT_COLORS[colorIndex] },
    ]);
    nextIdRef.current += 1;
    setNewItemLabel("");
    setResult(null);
  }, [newItemLabel]);

  const removeItem = useCallback(
    (id: number) => {
      if (items.length <= 2) return;
      setItems((prev) => prev.filter((item) => item.id !== id));
      setResult(null);
    },
    [items.length],
  );

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold">🎡 ルーレット</h1>

      {/* キャンバス */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={400}
          height={400}
          className="rounded-full shadow-xl"
          style={{ maxWidth: "100%", height: "auto" }}
        />
      </div>

      {/* 結果表示 */}
      {result && (
        <div className="rounded-xl border-2 border-primary bg-primary/10 px-6 py-4 text-center animate-in fade-in zoom-in duration-300">
          <p className="text-sm text-muted-foreground mb-1">結果</p>
          <p className="text-2xl font-bold text-primary">{result}</p>
        </div>
      )}

      {/* スピンボタン */}
      <Button
        size="lg"
        className="w-40 text-lg"
        onClick={spin}
        disabled={isSpinning || items.length < 2}
      >
        {isSpinning ? "回転中..." : "スピン！"}
      </Button>

      {/* 項目追加フォーム */}
      <div className="w-full max-w-sm flex gap-2">
        <Input
          placeholder="項目を入力..."
          value={newItemLabel}
          onChange={(e) => setNewItemLabel(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addItem()}
          disabled={isSpinning}
        />
        <Button onClick={addItem} disabled={isSpinning || !newItemLabel.trim()}>
          追加
        </Button>
      </div>

      {/* 項目リスト */}
      <div className="w-full max-w-sm">
        <p className="text-sm text-muted-foreground mb-2">項目一覧 ({items.length})</p>
        <ul className="space-y-1">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span>{item.label}</span>
              </div>
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                disabled={isSpinning || items.length <= 2}
                className="text-muted-foreground hover:text-destructive disabled:opacity-30 transition-colors ml-2"
                aria-label="削除"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
