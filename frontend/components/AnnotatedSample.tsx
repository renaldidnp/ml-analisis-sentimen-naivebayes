"use client";

type Segment = {
  text: string;
  tag?: "positive" | "negative";
  label?: string;
};

const segments: Segment[] = [
  { text: "Alhamdulillah program MBG di sekolah anak saya " },
  { text: "lancar dan menunya bergizi", tag: "positive", label: "positif" },
  { text: ", tapi " },
  { text: "porsinya kadang kurang", tag: "negative", label: "negatif" },
  { text: " buat anak SD kelas atas." },
];

export default function AnnotatedSample() {
  let tagIndex = 0;

  return (
    <div className="rounded-2xl border border-ink/10 bg-white/60 p-5 shadow-[0_1px_0_0_rgba(25,31,27,0.04)] backdrop-blur-sm sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <span className="eyebrow">Contoh cuitan</span>
        <span className="font-mono text-[11px] text-muted">
          @wargasekolah · 08:41
        </span>
      </div>

      <p className="font-sans text-[15px] leading-relaxed text-ink sm:text-base">
        {segments.map((seg, i) => {
          if (!seg.tag) {
            return <span key={i}>{seg.text}</span>;
          }
          tagIndex += 1;
          const delay = `${300 + tagIndex * 350}ms`;
          return (
            <span key={i} className="relative">
              <span
                className={
                  seg.tag === "positive"
                    ? "rounded-[3px] bg-sage/10 px-0.5"
                    : "rounded-[3px] bg-brick/10 px-0.5"
                }
              >
                {seg.text}
              </span>{" "}
              <span
                className={`tag-chip motion-safe:animate-tag-pop opacity-0 motion-reduce:opacity-100 ${
                  seg.tag === "positive"
                    ? "tag-chip--positive"
                    : "tag-chip--negative"
                }`}
                style={{ animationDelay: delay }}
              >
                {seg.tag === "positive" ? "▲" : "▼"} {seg.label}
              </span>{" "}
            </span>
          );
        })}
      </p>

      <div className="mt-5 flex items-center gap-2 border-t border-ink/10 pt-4">
        <span className="h-1.5 w-1.5 rounded-full bg-sage" />
        <span className="font-mono text-[11px] text-muted">
          diberi label otomatis oleh model — bukan ditulis manual
        </span>
      </div>
    </div>
  );
}
