import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import CodeBlock from '@tiptap/extension-code-block';
import Placeholder from '@tiptap/extension-placeholder';
import { api } from '../api/client.js';

function ToolbarBtn({ onClick, active, title, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`toolbar-btn ${active ? 'toolbar-btn--active' : ''}`}
      title={title}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="toolbar-divider" aria-hidden="true" />;
}

export default function Editor({ content, onChange }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      CodeBlock,
      Image.configure({ inline: false, allowBase64: false }),
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: 'noopener noreferrer' } }),
      Placeholder.configure({ placeholder: 'Start writing your post…' }),
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      onChange?.({
        json: editor.getJSON(),
        html: editor.getHTML(),
      });
    },
  });

  if (!editor) return null;

  async function insertImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const { url } = await api.uploadImage(file);
        editor.chain().focus().setImage({ src: url }).run();
      } catch (err) {
        alert('Image upload failed: ' + err.message);
      }
    };
    input.click();
  }

  function setLink() {
    const url = window.prompt('URL:', editor.getAttributes('link').href || 'https://');
    if (url === null) return;
    if (url === '') { editor.chain().focus().unsetLink().run(); return; }
    editor.chain().focus().setLink({ href: url }).run();
  }

  const e = editor;
  return (
    <div className="editor-wrapper">
      <div className="editor-toolbar">
        <ToolbarBtn onClick={() => e.chain().focus().toggleBold().run()} active={e.isActive('bold')} title="Bold (Ctrl+B)"><b>B</b></ToolbarBtn>
        <ToolbarBtn onClick={() => e.chain().focus().toggleItalic().run()} active={e.isActive('italic')} title="Italic (Ctrl+I)"><i>I</i></ToolbarBtn>
        <ToolbarBtn onClick={() => e.chain().focus().toggleStrike().run()} active={e.isActive('strike')} title="Strikethrough"><s>S</s></ToolbarBtn>
        <Divider />
        <ToolbarBtn onClick={() => e.chain().focus().toggleHeading({ level: 2 }).run()} active={e.isActive('heading', { level: 2 })} title="Heading 2">H2</ToolbarBtn>
        <ToolbarBtn onClick={() => e.chain().focus().toggleHeading({ level: 3 }).run()} active={e.isActive('heading', { level: 3 })} title="Heading 3">H3</ToolbarBtn>
        <Divider />
        <ToolbarBtn onClick={() => e.chain().focus().toggleBulletList().run()} active={e.isActive('bulletList')} title="Bullet list">• List</ToolbarBtn>
        <ToolbarBtn onClick={() => e.chain().focus().toggleOrderedList().run()} active={e.isActive('orderedList')} title="Ordered list">1. List</ToolbarBtn>
        <Divider />
        <ToolbarBtn onClick={() => e.chain().focus().toggleBlockquote().run()} active={e.isActive('blockquote')} title="Blockquote">"</ToolbarBtn>
        <ToolbarBtn onClick={() => e.chain().focus().toggleCode().run()} active={e.isActive('code')} title="Inline code">`</ToolbarBtn>
        <ToolbarBtn onClick={() => e.chain().focus().toggleCodeBlock().run()} active={e.isActive('codeBlock')} title="Code block">```</ToolbarBtn>
        <Divider />
        <ToolbarBtn onClick={setLink} active={e.isActive('link')} title="Link">🔗</ToolbarBtn>
        <ToolbarBtn onClick={insertImage} title="Insert image">🖼</ToolbarBtn>
        <Divider />
        <ToolbarBtn onClick={() => e.chain().focus().undo().run()} title="Undo">↩</ToolbarBtn>
        <ToolbarBtn onClick={() => e.chain().focus().redo().run()} title="Redo">↪</ToolbarBtn>
      </div>
      <EditorContent editor={editor} className="editor-content" />
    </div>
  );
}
