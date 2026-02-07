import { useState } from 'react';

const TOOLBAR_ACTIONS = ['bold', 'italic', 'underline', 'link', 'code'] as const;

type ToolbarAction = typeof TOOLBAR_ACTIONS[number];

export default function RichTextEditor({ onChange }: { onChange?: (value: string) => void }) {
    const [value, setValue] = useState('');

    const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        const nextValue = event.target.value;
        setValue(nextValue);
        onChange?.(nextValue);
    };

    const handleAction = (action: ToolbarAction) => {
        // Placeholder action handler – integrate real editor later
        console.info(`[RichTextEditor] Action triggered: ${action}`);
    };

    return (
        <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap gap-2">
                {TOOLBAR_ACTIONS.map((action) => (
                    <button
                        key={action}
                        type="button"
                        onClick={() => handleAction(action)}
                        className="rounded-lg border border-gray-200 px-3 py-1 text-sm font-medium text-gray-600 hover:bg-gray-50"
                    >
                        {action.toUpperCase()}
                    </button>
                ))}
            </div>
            <textarea
                value={value}
                onChange={handleInput}
                rows={8}
                className="w-full resize-y rounded-lg border border-gray-200 p-3 font-mono text-sm text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Write rich content here..."
            />
        </div>
    );
}
