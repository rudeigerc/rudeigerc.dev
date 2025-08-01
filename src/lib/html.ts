import htm from "htm";

const html = htm.bind((type: string, props: object, ...children: unknown[]) => {
  return { type, props: { ...props, children } };
});

export { html };
