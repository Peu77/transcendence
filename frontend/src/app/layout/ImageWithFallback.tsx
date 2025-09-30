import { h, useState } from "refreshjs";

export function ImageWithFallback(props: any) {
  const [didError, setDidError] = useState(false);

  const handleError = () => setDidError(true);
  const { src, alt, style, className, ...rest } = props;
  const ERROR_IMG_SRC = "/images/placeholder.png";

  return didError ? (
    <div
      className={`inline-block bg-gray-100 text-center align-middle ${className ?? ""}`}
      style={style}
    >
      <div className="flex items-center justify-center w-full h-full">
        <img
          src={ERROR_IMG_SRC}
          alt="Error loading image"
          data-original-url={src}
          {...rest}
        />
      </div>
    </div>
  ) : (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      onError={handleError}
      {...rest}
    />
  );
}
