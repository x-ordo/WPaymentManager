/**
 * PartyGraph - Main React Flow component for party relationship visualization
 * User Story 1: Party Relationship Graph
 */

'use client';

import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type Connection,
  type OnNodesChange,
  type OnEdgesChange,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { usePartyGraph } from '@/hooks/usePartyGraph';
import { useTheme } from '@/contexts/ThemeContext';
import { useEvidenceLinks } from '@/hooks/useEvidenceLinks';
import {
  usePartyGraphEvidence,
  usePartyGraphModals,
  usePartyGraphRegeneration,
} from '@/hooks/party';
import type {
  PartyNodeCreate,
  PartyNodeUpdate,
  RelationshipCreate,
  RelationshipUpdate,
  EvidenceLinkCreate,
} from '@/types/party';
import { PartyNode, type PartyNodeType, type PartyNodeData as FlowNodeData } from './PartyNode';
import { PartyEdge, type PartyEdgeType, type PartyEdgeData } from './PartyEdge';
import { PartyModal } from './PartyModal';
import { RelationshipModal } from './RelationshipModal';
import { EvidenceLinkModal } from './EvidenceLinkModal';
import { EvidenceLinkPopover } from './EvidenceLinkPopover';
import { PartyGraphToolbar } from './toolbar/PartyGraphToolbar';
import {
  PartyGraphEmpty,
  PartyGraphLoading,
  PartyGraphError,
  SaveStatusIndicator,
} from './states';
import { toFlowNodes, toFlowEdges } from './utils/graphTransformers';

interface PartyGraphProps {
  caseId: string;
}

// Custom node types
const nodeTypes = {
  party: PartyNode,
};

// Custom edge types
const edgeTypes = {
  relationship: PartyEdge,
};

export function PartyGraph({ caseId }: PartyGraphProps) {
  const { isDark } = useTheme();
  const {
    nodes: partyNodes,
    relationships,
    isLoading,
    error,
    saveStatus,
    addNode,
    updateNode,
    deleteNode,
    addRelationship,
    updateRelationshipData,
    deleteRelationshipById,
    updateNodePosition,
    refresh,
  } = usePartyGraph(caseId);

  // Evidence links hook
  const {
    links: evidenceLinks,
    isLoading: isLoadingLinks,
    addLink,
    removeLink,
  } = useEvidenceLinks({ caseId });

  // Helper to get links for a specific party
  const getLinksForParty = useCallback(
    (partyId: string) => evidenceLinks.filter((link) => link.party_id === partyId),
    [evidenceLinks]
  );

  // React Flow state
  const initialNodes = useMemo(() => toFlowNodes(partyNodes), [partyNodes]);
  const initialEdges = useMemo(() => toFlowEdges(relationships), [relationships]);

  const [nodes, setNodes, onNodesChange] = useNodesState<PartyNodeType>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<PartyEdgeType>(initialEdges);

  // Sync with backend data
  useMemo(() => {
    setNodes(toFlowNodes(partyNodes));
    setEdges(toFlowEdges(relationships));
  }, [partyNodes, relationships, setNodes, setEdges]);

  const {
    partyModalOpen,
    relationshipModalOpen,
    evidenceLinkModalOpen,
    selectedParty,
    selectedRelationship,
    pendingConnection,
    popoverParty,
    popoverPosition,
    openPartyModal,
    closePartyModal,
    openRelationshipModal,
    closeRelationshipModal,
    openEvidenceLinkModal,
    closeEvidenceLinkModal,
    openPopover,
    closePopover,
  } = usePartyGraphModals();

  const { evidenceList, isLoadingEvidence, evidenceLoadError } = usePartyGraphEvidence({
    caseId,
    isOpen: evidenceLinkModalOpen,
  });

  const { isRegenerating, regenerateMessage, handleRegenerateGraph } = usePartyGraphRegeneration({
    caseId,
    refresh,
  });

  const autoExtractedCount = useMemo(
    () => partyNodes.filter((party) => party.is_auto_extracted).length,
    [partyNodes]
  );

  // Handle node position change (drag)
  const handleNodesChange: OnNodesChange<PartyNodeType> = useCallback(
    (changes) => {
      onNodesChange(changes);

      // Save position updates
      changes.forEach((change) => {
        if (change.type === 'position' && change.position && !change.dragging) {
          updateNodePosition(change.id, change.position);
        }
      });
    },
    [onNodesChange, updateNodePosition]
  );

  // Handle edge changes
  const handleEdgesChange: OnEdgesChange<PartyEdgeType> = useCallback(
    (changes) => {
      onEdgesChange(changes);
    },
    [onEdgesChange]
  );

  // Handle new connection (edge creation)
  const handleConnect = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target) {
        openRelationshipModal(null, {
          source: connection.source,
          target: connection.target,
        });
      }
    },
    [openRelationshipModal]
  );

  // Handle node click (edit)
  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const party = partyNodes.find((p) => p.id === node.id);
      if (party) {
        openPartyModal(party);
      }
    },
    [partyNodes, openPartyModal]
  );

  // Handle edge click (edit relationship)
  const handleEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      const rel = relationships.find((r) => r.id === edge.id);
      if (rel) {
        openRelationshipModal(rel);
      }
    },
    [relationships, openRelationshipModal]
  );

  // Add party button click
  const handleAddPartyClick = useCallback(() => {
    openPartyModal(null);
  }, [openPartyModal]);

  // Save party (create or update)
  const handleSaveParty = useCallback(
    async (data: PartyNodeCreate | PartyNodeUpdate) => {
      if (selectedParty) {
        await updateNode(selectedParty.id, data as PartyNodeUpdate);
      } else {
        await addNode(data as PartyNodeCreate);
      }
    },
    [selectedParty, addNode, updateNode]
  );

  // Delete party
  const handleDeleteParty = useCallback(async () => {
    if (selectedParty) {
      await deleteNode(selectedParty.id);
    }
  }, [selectedParty, deleteNode]);

  // Save relationship (create or update)
  const handleSaveRelationship = useCallback(
    async (data: RelationshipCreate | RelationshipUpdate) => {
      if (selectedRelationship) {
        await updateRelationshipData(selectedRelationship.id, data as RelationshipUpdate);
      } else if (pendingConnection) {
        await addRelationship({
          ...(data as RelationshipCreate),
          source_party_id: pendingConnection.source,
          target_party_id: pendingConnection.target,
        });
      } else {
        await addRelationship(data as RelationshipCreate);
      }
    },
    [selectedRelationship, pendingConnection, addRelationship, updateRelationshipData]
  );

  // Delete relationship
  const handleDeleteRelationship = useCallback(async () => {
    if (selectedRelationship) {
      await deleteRelationshipById(selectedRelationship.id);
    }
  }, [selectedRelationship, deleteRelationshipById]);

  // Evidence link handlers
  const handleOpenEvidenceLinkModal = useCallback(() => {
    openEvidenceLinkModal();
  }, [openEvidenceLinkModal]);

  const handleSaveEvidenceLink = useCallback(
    async (data: EvidenceLinkCreate) => {
      await addLink(data);
    },
    [addLink]
  );

  // Handle right-click on node for evidence popover
  const handleNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();
      const party = partyNodes.find((p) => p.id === node.id);
      if (party) {
        openPopover(party, { x: event.clientX, y: event.clientY });
      }
    },
    [partyNodes, openPopover]
  );

  const handleViewEvidence = useCallback((evidenceId: string) => {
    // In production, this would navigate to evidence detail or open a viewer
    console.log('View evidence:', evidenceId);
  }, []);

  // Render states
  if (isLoading) {
    return (
      <div className="relative w-full h-[600px] border border-gray-200 dark:border-neutral-700 rounded-lg overflow-hidden">
        <PartyGraphLoading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative w-full h-[600px] border border-gray-200 dark:border-neutral-700 rounded-lg overflow-hidden">
        <PartyGraphError message={error} onRetry={refresh} />
      </div>
    );
  }

  if (partyNodes.length === 0) {
    return (
      <div className="relative w-full h-[600px] border border-gray-200 dark:border-neutral-700 rounded-lg overflow-hidden">
        <PartyGraphEmpty
          onAddParty={handleAddPartyClick}
          onRegenerate={handleRegenerateGraph}
          isRegenerating={isRegenerating}
        />
        {/* 019-party-extraction-prompt: 재생성 결과 메시지 (Empty 상태에서도 표시) */}
        {regenerateMessage && (
          <div className={`absolute top-4 left-4 z-10 px-4 py-2 rounded-lg shadow text-sm font-medium ${
            regenerateMessage.includes('실패') || regenerateMessage.includes('오류')
              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
              : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
          }`}>
            {regenerateMessage}
          </div>
        )}
        <PartyModal
          isOpen={partyModalOpen}
          onClose={closePartyModal}
          onSave={handleSaveParty}
          party={null}
        />
      </div>
    );
  }

  return (
    <div className="relative w-full h-[600px] border border-gray-200 dark:border-neutral-700 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <PartyGraphToolbar
        onAddParty={handleAddPartyClick}
        onOpenEvidenceLinkModal={handleOpenEvidenceLinkModal}
        onRegenerate={handleRegenerateGraph}
        isRegenerating={isRegenerating}
        autoExtractedCount={autoExtractedCount}
      />

      {/* 019-party-extraction-prompt: 재생성 결과 메시지 */}
      {regenerateMessage && (
        <div className={`absolute top-16 left-4 z-10 px-4 py-2 rounded-lg shadow text-sm font-medium ${
          regenerateMessage.includes('실패') || regenerateMessage.includes('오류')
            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
            : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
        }`}>
          {regenerateMessage}
        </div>
      )}

      {/* Save status */}
      <SaveStatusIndicator status={saveStatus} />

      {/* React Flow */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        onNodeContextMenu={handleNodeContextMenu}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        defaultEdgeOptions={{
          type: 'relationship',
        }}
        className={isDark ? 'dark-flow' : ''}
      >
        <Controls className={isDark ? 'dark-controls' : ''} />
        <Background
          variant={BackgroundVariant.Dots}
          gap={16}
          size={1}
          color={isDark ? '#404040' : '#e5e5e5'}
        />
        <MiniMap
          nodeColor={(node) => {
            const data = node.data as FlowNodeData;
            switch (data.type) {
              case 'plaintiff':
                return '#10B981'; // emerald-500
              case 'defendant':
                return '#EC4899'; // pink-500
              case 'third_party':
                return '#10B981'; // emerald-500
              case 'child':
                return '#0EA5E9'; // sky-500
              case 'family':
                return '#9CA3AF'; // gray-400
              default:
                return '#6B7280';
            }
          }}
          maskColor={isDark ? 'rgba(38, 38, 38, 0.8)' : 'rgba(255, 255, 255, 0.8)'}
          style={{
            backgroundColor: isDark ? '#262626' : '#ffffff',
          }}
        />
      </ReactFlow>

      {/* Party Modal */}
      <PartyModal
        isOpen={partyModalOpen}
        onClose={closePartyModal}
        onSave={handleSaveParty}
        party={selectedParty}
      />

      {/* Relationship Modal */}
      <RelationshipModal
        isOpen={relationshipModalOpen}
        onClose={closeRelationshipModal}
        onSave={handleSaveRelationship}
        onDelete={selectedRelationship ? handleDeleteRelationship : undefined}
        relationship={selectedRelationship}
        parties={partyNodes}
        sourcePartyId={pendingConnection?.source}
        targetPartyId={pendingConnection?.target}
      />

      {/* Evidence Link Modal */}
      <EvidenceLinkModal
        isOpen={evidenceLinkModalOpen}
        onClose={closeEvidenceLinkModal}
        onSave={handleSaveEvidenceLink}
        parties={partyNodes}
        relationships={relationships}
        evidenceList={evidenceList}
        isLoadingEvidence={isLoadingEvidence}
        evidenceLoadError={evidenceLoadError}
        preSelectedPartyId={popoverParty?.id}
      />

      {/* Evidence Link Popover */}
      {popoverParty && popoverPosition && (
        <div
          style={{
            position: 'fixed',
            left: popoverPosition.x,
            top: popoverPosition.y,
            zIndex: 100,
          }}
        >
          <EvidenceLinkPopover
            party={popoverParty}
            links={getLinksForParty(popoverParty.id)}
            isLoading={isLoadingLinks}
            onClose={closePopover}
            onLinkEvidence={handleOpenEvidenceLinkModal}
            onRemoveLink={async (linkId) => { await removeLink(linkId); }}
            onViewEvidence={handleViewEvidence}
          />
        </div>
      )}
    </div>
  );
}
