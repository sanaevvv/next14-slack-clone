import Quill from 'quill';
import { useEffect, useRef, useState } from 'react';

type Props = {
  value: string;
};

const Renderer = ({ value }: Props) => {
  const [isEmpty, setIsEmpty] = useState(false);
  const rendererRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!rendererRef.current) return;

    const container = rendererRef.current;

    // 一時的なコンテナとしてエディタを作成するためにdiv要素を追加;
    const quill = new Quill(document.createElement('div'), {
      theme: 'snow',
    });

    // 読み取り専用モード
    quill.enable(false);

    const contents = JSON.parse(value);

    quill.setContents(contents);

    const isEmpty =
      quill
        .getText()
        .replace(/<(.|\n)*?>/g, '')
        .trim().length === 0;

    setIsEmpty(isEmpty);

    // Quillエディタの内容を実際に表示させる;
    container.innerHTML = quill.root.innerHTML;

    return () => {
      container.innerHTML = '';
    };
  }, [value]);

  if (isEmpty) return null;

  return <div ref={rendererRef} className="ql-editor ql-renderer"></div>;
};

export default Renderer
