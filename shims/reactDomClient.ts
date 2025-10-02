const globalObj = globalThis as typeof globalThis & {
  ReactDOM?: any;
  ReactDOMClient?: any;
};

const resolveClient = () => {
  if (globalObj.ReactDOMClient?.createRoot) {
    return globalObj.ReactDOMClient;
  }
  if (globalObj.ReactDOM?.createRoot) {
    return globalObj.ReactDOM;
  }
  if (globalObj.ReactDOM) {
    const legacy = globalObj.ReactDOM;
    return {
      createRoot(container: Element) {
        return {
          render(element: any) {
            legacy.render(element, container);
          },
          unmount() {
            if (typeof legacy.unmountComponentAtNode === 'function') {
              legacy.unmountComponentAtNode(container);
            }
          },
        };
      },
    };
  }
  throw new Error('ReactDOM global not found. Ensure vendor/react-dom.production.min.js is loaded before the bundle.');
};

const client = resolveClient();

export const { createRoot } = client;

export default client;
