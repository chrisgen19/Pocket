import { X } from 'lucide-react';

/** Joins class names, skipping falsy ones. */
export const cx = (...classes: Array<string | false | undefined>): string =>
  classes.filter(Boolean).join(' ');

type TagChipProps = {
  tag: string;
  disabled?: boolean;
  onRemove: () => void;
};

/** One tag in TagChipsInput, with its remove button. */
export function TagChip({ tag, disabled, onRemove }: TagChipProps) {
  return (
    <span className="inline-flex items-center gap-0.5 rounded-md bg-muted py-0.5 pr-0.5 pl-2 text-xs font-medium">
      {tag}
      <button
        type="button"
        aria-label={`Remove tag ${tag}`}
        disabled={disabled}
        onClick={onRemove}
        className="rounded-sm p-0.5 text-muted-foreground hover:bg-background hover:text-foreground"
      >
        <X className="size-3" />
      </button>
    </span>
  );
}

type TagSuggestionListProps = {
  /** Also the prefix of each option id, for the field's aria-activedescendant. */
  id: string;
  suggestions: string[];
  activeIdx: number;
  onPick: (tag: string) => void;
};

/**
 * Suggestions under TagChipsInput. Options stay unfocused: the field keeps focus and
 * points at the highlighted one with aria-activedescendant (`${id}-${index}`). Unlike
 * the web app's floating list, this one sits in the flow: the popup grows to fit it, so
 * it never covers the Save button right below.
 */
export function TagSuggestionList({ id, suggestions, activeIdx, onPick }: TagSuggestionListProps) {
  return (
    <div
      id={id}
      role="listbox"
      aria-label="Tag suggestions"
      className="mt-1 max-h-40 overflow-auto rounded-lg border bg-popover py-1"
    >
      {suggestions.map((tag, i) => (
        <div
          key={tag}
          id={`${id}-${i}`}
          role="option"
          tabIndex={-1}
          aria-selected={i === activeIdx}
          // On mousedown (not click) and without default, so the field never blurs and
          // adds the half-typed text first.
          onMouseDown={(e) => {
            e.preventDefault();
            onPick(tag);
          }}
          className={cx(
            'cursor-default px-3 py-1.5 text-xs',
            i === activeIdx ? 'bg-muted text-foreground' : 'text-muted-foreground',
          )}
        >
          {tag}
        </div>
      ))}
    </div>
  );
}
