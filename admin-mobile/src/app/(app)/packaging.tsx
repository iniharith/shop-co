import React from 'react';
import FolderQueue from '../../components/FolderQueue';

export default function PackagingScreen() {
  return <FolderQueue title="Packaging" subtitle="Folders ready to pack and ship" statuses={['PACKAGING']} nextStatus="SHIPPED" nextLabel="Mark as Shipped" mode="packaging" />;
}
