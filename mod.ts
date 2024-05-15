import { ComponentChild, ComponentClass } from "preact";
import { Component, h } from "preact";

// deno-lint-ignore no-explicit-any
type Props = any;
type Views = ((props: Props) => h.JSX.Element) | ComponentClass<Props>;
type PropsOf<C extends Views> = C extends () => unknown ? void
  : C extends (props: infer X) => unknown ? X
  : C extends ComponentClass<infer X> ? X
  : never;
type PathOf<R extends Paths> = string & keyof R;

export type Paths = {
  readonly [path: string]: Views;
};
// if component does not take props, allow omit props
type SwitchArguments<T extends Paths, K extends PathOf<T>> = void extends
  PropsOf<T[K]> ? [K] : [K, PropsOf<T[K]>];

export type SwitcherContext<T extends Paths> = {
  switch<K extends PathOf<T>>(
    ...args: SwitchArguments<T, K>
  ): void;
};

export function createSwitcher<T extends Paths>(
  paths: T,
) {
  let onswitch: undefined | ((path: PathOf<Paths>, props: Props) => void);
  const context: SwitcherContext<T> = {
    switch<K extends PathOf<T>>(
      ...[path, props]: SwitchArguments<T, K>
    ): void {
      if (onswitch === undefined) {
        throw new Error("switcher was not mounted.");
      }
      onswitch(path, props);
    },
  };

  class SwitcherComponent extends SwitcherComponentBase<T> {
    constructor() {
      super(paths);
    }

    override componentWillMount(): void {
      onswitch = (path, props) => {
        this.setState({ path, props });
      };
      super.componentWillMount?.();
    }

    override componentWillUnmount(): void {
      super.componentWillUnmount?.();
      onswitch = undefined;
    }
  }

  return [SwitcherComponent, context] as const;
}

type SwitcherComponentProps<T extends Paths> = {
  // if component does not take props, allow omit initialProps
  [p in PathOf<T>]: void extends PropsOf<T[p]> ? {
    path: p;
  }
  : {
    path: p;
    props: PropsOf<T[p]>;
  };
}[PathOf<T>];

export class SwitcherComponentBase<T extends Paths> extends Component<
  SwitcherComponentProps<T>,
  { path: PathOf<T>; props: PropsOf<T[keyof T]>; }
> {
  #paths: Paths;
  constructor(
    paths: Paths,
  ) {
    super();
    this.#paths = paths;
  }

  override componentWillMount(): void {
    const path = this.props.path;
    const props = (() => {
      if ("props" in this.props) {
        return this.props.props;
      } else {
        return undefined;
      }
    })();

    this.setState({
      path,
      props,
    });
  }

  override render(): ComponentChild {
    const { path, props } = this.state;
    const Comp = this.#paths[path];
    return h(Comp, props);
  }
}
