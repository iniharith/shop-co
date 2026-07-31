import React from 'react';
import FolderQueue from '../../components/FolderQueue';

export default function ProductionScreen() {
  return <FolderQueue title="Production" subtitle="Printing and held production folders" statuses={['IN_PRODUCTION', 'HOLD_PRINTING']} nextStatus="PACKAGING" nextLabel="Move to Packaging" mode="production" />;
}
