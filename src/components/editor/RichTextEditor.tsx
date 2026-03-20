"use client";

import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';

type RichTextEditorProps = {
    onChange?: (value: string) => void;
    initialValue?: string;
    placeholder?: string;
};

const TOOLBAR_BUTTON_CLASS =
    'rounded-lg border px-3 py-1 text-sm font-medium transition-colors';

export default function RichTextEditor({
    onChange,
    initialValue = '',
    placeholder = 'Ecrivez votre contenu ici...',
}: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            Link.configure({
                openOnClick: false,
                autolink: true,
                defaultProtocol: 'https',
            }),
        ],
        content: initialValue,
        immediatelyRender: false,
        onUpdate: ({ editor: currentEditor }) => {
            onChange?.(currentEditor.getHTML());
        },
        editorProps: {
            attributes: {
                class:
                    'min-h-[220px] w-full rounded-lg border border-gray-200 p-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500',
                'aria-label': placeholder,
            },
        },
    });

    const setLink = () => {
        if (!editor) {
            return;
        }

        const previousUrl = editor.getAttributes('link').href as string | undefined;
        const url = window.prompt('Entrez une URL', previousUrl ?? 'https://');

        if (url === null) {
            return;
        }

        const trimmedUrl = url.trim();
        if (trimmedUrl.length === 0) {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }

        editor.chain().focus().extendMarkRange('link').setLink({ href: trimmedUrl }).run();
    };

    const clearFormatting = () => {
        editor?.chain().focus().unsetAllMarks().clearNodes().run();
    };

    if (!editor) {
        return (
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <p className="text-sm text-gray-500">Chargement de l'editeur...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap gap-2">
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={`${TOOLBAR_BUTTON_CLASS} ${editor.isActive('bold')
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                    Gras
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={`${TOOLBAR_BUTTON_CLASS} ${editor.isActive('italic')
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                    Italique
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    className={`${TOOLBAR_BUTTON_CLASS} ${editor.isActive('underline')
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                    Souligne
                </button>
                <button
                    type="button"
                    onClick={setLink}
                    className={`${TOOLBAR_BUTTON_CLASS} ${editor.isActive('link')
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                    Lien
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleCode().run()}
                    className={`${TOOLBAR_BUTTON_CLASS} ${editor.isActive('code')
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                    Code
                </button>
                <button
                    type="button"
                    onClick={clearFormatting}
                    className={`${TOOLBAR_BUTTON_CLASS} border-gray-200 text-gray-600 hover:bg-gray-50`}
                >
                    Reinitialiser
                </button>
            </div>

            <EditorContent editor={editor} />
        </div>
    );
}
