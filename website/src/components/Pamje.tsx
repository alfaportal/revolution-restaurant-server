export default function Pamje({
  emri,
  nentitulli,
  foto,
}: {
  emri: string;
  nentitulli: string;
  foto: string;
}) {
  return (
    <figure className="overflow-hidden rounded-xl border border-white/10 bg-[#0b1220]">
      <div className="aspect-video">
        <img src={foto} alt={`${emri} — ${nentitulli}`} className="h-full w-full object-cover" />
      </div>
      <figcaption className="px-4 py-3 text-center text-sm font-semibold text-white">{nentitulli}</figcaption>
    </figure>
  );
}
