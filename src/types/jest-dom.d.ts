import '@testing-library/jest-dom';

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveClass(className: string): R;
      toHaveValue(value: string | number): R;
      toHaveAttribute(attr: string, value?: string): R;
      // Use Record<string, unknown> instead of any
      toHaveStyle(style: Record<string, unknown> | string): R;
      toBeDisabled(): R;
      toBeEnabled(): R;
      toBeChecked(): R;
      toBeVisible(): R;
      toBeEmpty(): R;
      toHaveFocus(): R;
      toContainElement(element: HTMLElement | null): R;
      toContainHTML(htmlText: string): R;
      toHaveTextContent(text: string | RegExp): R;
    }
  }
}
