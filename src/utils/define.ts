export function defineElement(tag: string, ctor: CustomElementConstructor) {
  if (!customElements.get(tag)) {
    customElements.define(tag, ctor);
  }
}
