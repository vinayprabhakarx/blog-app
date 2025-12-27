import React, { useMemo } from 'react';
import { Virtuoso } from 'react-virtuoso';
import MdRenderCard from './MdRenderCard'; // Re-use the existing sanitized renderer

const VirtualizedMdPreview = ({ content }) => {
  const chunks = useMemo(() => {
    if (!content) return [];
    
    // Improved Chunking Strategy
    // 1. Split by double newlines to get paragraphs/blocks
    // 2. Group these blocks into chunks of ~20 to balance memory vs render frequency
    const blocks = content.split(/\n\s*\n/);
    const chunks = [];
    let currentChunk = [];
    
    blocks.forEach((block) => {
      currentChunk.push(block);
      // If we have enough blocks, push to chunks
      if (currentChunk.length >= 20) {
        chunks.push(currentChunk.join("\n\n"));
        currentChunk = [];
      }
    });

    // Add remaining blocks
    if (currentChunk.length > 0) {
      chunks.push(currentChunk.join("\n\n"));
    }
    
    return chunks;
  }, [content]);

  return (
    <Virtuoso
      style={{ height: '100%', width: '100%' }}
      data={chunks}
      // Overscan ensures smooth scrolling by rendering a bit outside current view
      overscan={500} 
      itemContent={(index, chunkContent) => (
        <div className="pb-4 min-h-[50px] relative">
           <MdRenderCard content={chunkContent} />
        </div>
      )}
    />
  );
};

export default React.memo(VirtualizedMdPreview);
