import type { ComponentChildren } from "preact";
import { Component, h, createContext } from "preact";
import { useContext } from "preact/hooks";

const ReplaceContext = createContext((() => { }) as ((c: ComponentChildren) => void));

export function useReplacer() {
    const replace = useContext(ReplaceContext);
    return (children: ComponentChildren) => replace(children);
}

// deno-lint-ignore ban-types
export default class Replacer extends Component<{}, ComponentChildren> {
    constructor() {
        super();
        this.state = undefined;
    }

    override render() {
        return h(ReplaceContext.Provider, { value: (children) => this.setState(children) }, this.state);
    }
}