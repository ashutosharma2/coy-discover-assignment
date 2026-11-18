import Image from "next/image";

interface StampAvatarProps {
  src: string;
  name: string;
}

export function StampAvatar({ src, name }: StampAvatarProps) {
  return (
    <div className="stamp-frame">
      <div className="stamp">
        <Image src={src} alt={`Illustrated portrait of ${name}`} width={320} height={320} loading="eager" draggable={false} />
      </div>
    </div>
  );
}
