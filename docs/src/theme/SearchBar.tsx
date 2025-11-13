import React from 'react';
import SearchBar from '@theme-original/SearchBar';
import MeilisearchBar from '@site/src/components/MeilisearchBar';
import '@site/src/components/MeilisearchBar/styles.css';

export default function SearchBarWrapper(props) {
  // Use Meilisearch instead of default search
  return <MeilisearchBar {...props} />;
}
