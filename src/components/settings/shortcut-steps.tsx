import { Info } from 'lucide-react';

type ShortcutStepsProps = {
  /** Full URL of the bookmarks endpoint, e.g. https://pocket.cgdev.site/api/bookmarks. */
  endpoint: string;
  /** Header the API key goes in. */
  header: string;
};

const CODE = 'rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-800 whitespace-nowrap';
// The endpoint is long, so it may wrap anywhere instead of overflowing on phones.
const LONG_CODE = 'rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-800 break-all';

/** How to build the "Save to Pocket" shortcut for Safari's share sheet on iPhone. */
export function ShortcutSteps({ endpoint, header }: ShortcutStepsProps) {
  return (
    <ol className="list-decimal space-y-3 pl-5 text-sm text-gray-700 marker:text-gray-400">
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
        Add <strong>Get Contents of URL</strong> with the URL{' '}
        <code className={LONG_CODE}>{endpoint}</code>. Tap <strong>Show More</strong> and set:
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            Method: <strong>POST</strong>
          </li>
          <li>
            Headers: add <code className={CODE}>{header}</code> with your API key as the value
          </li>
          <li>
            Request Body: <strong>JSON</strong>, add a <strong>Text</strong> field named{' '}
            <code className={CODE}>url</code> whose value is the <strong>URLs</strong> variable from
            step 3
          </li>
        </ul>
      </li>
      <li>
        Add <strong>Get Dictionary Value</strong> for the key <code className={CODE}>title</code> in{' '}
        <strong>Contents of URL</strong>, then <strong>Show Notification</strong> with the text{' '}
        <strong>Saved to Pocket</strong> and the <strong>Dictionary Value</strong>. If the
        notification has no title, the key was wrong or revoked.
      </li>
      <li>
        In Safari, tap <strong>Share</strong> and choose <strong>Save to Pocket</strong>. The first
        time, allow the shortcut to connect to Pocket.
      </li>
    </ol>
  );
}
