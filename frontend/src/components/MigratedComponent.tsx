import { h, Fragment, useState } from 'refreshjs';

export default function MigratedComponent() {
  const [value, setValue] = useState(0);
  return (
    <Fragment>
      <div class="p-4 bg-gray-100 rounded shadow text-center">
        <p class="mb-2">MigratedComponent (refreshjs)</p>
        <button class="px-4 py-2 bg-blue-500 text-white rounded" onClick={() => setValue(v => v + 1)}>
          Increment: {value}
        </button>
      </div>
    </Fragment>
  );
}
