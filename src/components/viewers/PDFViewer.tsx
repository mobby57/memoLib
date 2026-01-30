interface PDFViewerProps {
    src: string;
    title?: string;
    height?: number;
}

export default function PDFViewer({ src, title = 'Document preview', height = 640 }: PDFViewerProps) {
    return (
        <div className="flex flex-col gap-3">
            <header className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
                <a
                    href={src}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                    Open in new tab
                </a>
            </header>
            <iframe
                title={title}
                src={src}
                className="w-full rounded-xl border border-gray-200"
                style={{ height }}
            />
        </div>
    );
}
