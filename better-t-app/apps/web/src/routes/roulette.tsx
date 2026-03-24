import { createFileRoute } from "@tanstack/react-router";

import { RouletteWheel } from "@/components/roulette-wheel";

export const Route = createFileRoute("/roulette")({
  component: RoulettePage,
});

function RoulettePage() {
  return (
    <div className="overflow-y-auto py-8">
      <RouletteWheel />
    </div>
  );
}
