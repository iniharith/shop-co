import React from 'react';
import FolderQueue from '../../components/FolderQueue';

export default function ProductionScreen() {
  return <FolderQueue title="Production" subtitle="Printing and Print AWB folders" statuses={['IN_PRODUCTION', 'PRINT_AWB']} nextStatus={(folder) => folder.orderStatus === 'PRINT_AWB' ? 'PACKAGING' : 'PRINT_AWB'} nextLabel={(folder) => folder.orderStatus === 'PRINT_AWB' ? 'Move to Packaging' : 'Send to Print AWB'} mode="production" />;
}
