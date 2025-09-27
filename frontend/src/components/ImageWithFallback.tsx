import { h, useState } from 'refreshjs';

export function ImageWithFallback(props) {
  const [didError, setDidError] = useState(false);

  const handleError = () => setDidError(true);
  const { src, alt, style, className, ...rest } = props;
  const ERROR_IMG_SRC =
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg==';

  return didError ? (
    h('div', { class: `inline-block bg-gray-100 text-center align-middle ${className ?? ''}`, style },
      h('div', { class: 'flex items-center justify-center w-full h-full' },
        h('img', { src: ERROR_IMG_SRC, alt: 'Error loading image', ...rest, 'data-original-url': src })
      )
    )
  ) : (
    h('img', { src, alt, class: className, style, ...rest, onError: handleError })
  );
}