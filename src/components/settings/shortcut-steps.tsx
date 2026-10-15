import { Info } from 'lucide-react';

type ShortcutStepsProps = {
  /** Full URL of the bookmarks endpoint, e.g. https://pocket.cgdev.site/api/bookmarks. */
  endpoint: string;
  /** Header the API key goes in. */
  header: string;
};

const CODE = 'rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground whitespace-nowrap';
// The endpoint is long, so it may wrap anywhere instead of overflowing on phones.
const LONG_CODE = 'rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground break-all';

/** How to build the "Save to Pocket" shortcut for Safari's share sheet on iPhone. */
export function ShortcutSteps({ endpoint, header }: ShortcutStepsProps) {
  return (
    <ol className="list-decimal space-y-3 pl-5 text-sm leading-6 text-foreground/85 marker:font-semibold marker:text-muted-foreground">
      <li>
        Create an API key above and copy it. On your iPhone, open <strong>Shortcuts</strong>, tap{' '}
        <strong>+</strong> and name the shortcut <strong>Save to Pocket</strong>.
      </li>
      <li>
        Open the shortcut's details (the{' '}
        <Info aria-label="info" className="inline h-4 w-4 align-text-bottom" /> button) and turn on{' '}
        <strong>Show in Share Sheet</strong>. Set the input types to <strong>URLs</strong> and{' '}
        <strong>Safari web pages</strong> only.
      </li>
      <li>
        Add the action <strong>Get URLs from Input</strong>, using <strong>Shortcut Input</strong>.
      </li>
      <li>
        Add a <strong>Text</strong> action and paste your API key into it.
      </li>
      <li>
        Add <strong>Get Contents of URL</strong>. Its URL starts out as the <strong>Text</strong>{' '}
        variable: clear it and enter <code className={LONG_CODE}>{endpoint}</code>. Tap{' '}
        <strong>Show More</strong> and set:
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            Method: <strong>POST</strong>
          </li>
          <li>
            Headers: add <code className={CODE}>{header}</code> with the <strong>Text</strong>{' '}
            variable as the value
          </li>
          <li>
            Request Body: <strong>JSON</strong>, add a <strong>Text</strong> field named{' '}
            <code className={CODE}>url</code> whose value is the <strong>URLs</strong> variable
          </li>
        </ul>
      </li>
      <li>
        Add <strong>Get Dictionary Value</strong> for the key <code className={CODE}>title</code> in{' '}
        <strong>Contents of URL</strong>.
      </li>
      <li>
        Add <strong>If</strong>, set to <strong>Dictionary Value</strong> has any value, then add:
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            Under <strong>If</strong>: <strong>Show Notification</strong> titled{' '}
            <strong>Saved to Pocket:</strong> showing the <strong>Dictionary Value</strong>
          </li>
          <li>
            Under <strong>Otherwise</strong>: <strong>Show Notification</strong> titled{' '}
            <strong>Pocket couldn't save:</strong> showing <strong>Contents of URL</strong>, which
            holds the server's error
          </li>
        </ul>
      </li>
      <li>
        In Safari, tap <strong>Share</strong> and choose <strong>Save to Pocket</strong>. The first
        time, allow the shortcut to connect to Pocket.
      </li>
    </ol>
  );
}
