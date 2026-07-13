import Image from "next/image";

type Props = {
  img: string;
  title: string;
  body: string;
  tint: string;
  imgTint?: string;
};

/**
 * Notion-style feature card: a tinted panel with a flat illustration in the
 * upper area and a title + body below.
 */
export function FeatureCard({ img, title, body, tint, imgTint }: Props) {
  return (
    <div
      className={`flex flex-col overflow-hidden rounded-2xl border border-black/[0.06] ${tint}`}
    >
      <div
        className={`relative aspect-[16/10] overflow-hidden ${imgTint ?? ""}`}
      >
        <Image
          src={img}
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover"
          aria-hidden="true"
        />
      </div>
      <div className="p-5 sm:p-6">
        <p className="text-[15px] font-semibold text-ink">{title}</p>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{body}</p>
      </div>
    </div>
  );
}
