type LogoMarkProps = {
  className?: string;
  title?: string;
};

export default function LogoMark({
  className = "w-7 h-7",
  title = "Kost logo",
}: LogoMarkProps) {
  return (
    <img
      src="/logo-mark.svg"
      alt={title}
      className={className}
      loading="eager"
      onError={(event) => {
        (event.currentTarget as HTMLImageElement).src = "/logo-mark.svg";
      }}
    />
  );
}
