import { useCallback, useState } from 'react';
import type { PartyNode as PartyNodeData, PartyRelationship } from '@/types/party';

interface PendingConnection {
  source: string;
  target: string;
}

interface PopoverPosition {
  x: number;
  y: number;
}

export function usePartyGraphModals() {
  const [partyModalOpen, setPartyModalOpen] = useState(false);
  const [relationshipModalOpen, setRelationshipModalOpen] = useState(false);
  const [evidenceLinkModalOpen, setEvidenceLinkModalOpen] = useState(false);
  const [selectedParty, setSelectedParty] = useState<PartyNodeData | null>(null);
  const [selectedRelationship, setSelectedRelationship] = useState<PartyRelationship | null>(null);
  const [pendingConnection, setPendingConnection] = useState<PendingConnection | null>(null);
  const [popoverParty, setPopoverParty] = useState<PartyNodeData | null>(null);
  const [popoverPosition, setPopoverPosition] = useState<PopoverPosition | null>(null);

  const openPartyModal = useCallback((party?: PartyNodeData | null) => {
    setSelectedParty(party ?? null);
    setPartyModalOpen(true);
  }, []);

  const closePartyModal = useCallback(() => {
    setPartyModalOpen(false);
    setSelectedParty(null);
  }, []);

  const openRelationshipModal = useCallback(
    (relationship?: PartyRelationship | null, connection?: PendingConnection | null) => {
      setSelectedRelationship(relationship ?? null);
      setPendingConnection(connection ?? null);
      setRelationshipModalOpen(true);
    },
    []
  );

  const closeRelationshipModal = useCallback(() => {
    setRelationshipModalOpen(false);
    setSelectedRelationship(null);
    setPendingConnection(null);
  }, []);

  const openEvidenceLinkModal = useCallback(() => {
    setPopoverParty(null);
    setPopoverPosition(null);
    setEvidenceLinkModalOpen(true);
  }, []);

  const closeEvidenceLinkModal = useCallback(() => {
    setEvidenceLinkModalOpen(false);
  }, []);

  const openPopover = useCallback((party: PartyNodeData, position: PopoverPosition) => {
    setPopoverParty(party);
    setPopoverPosition(position);
  }, []);

  const closePopover = useCallback(() => {
    setPopoverParty(null);
    setPopoverPosition(null);
  }, []);

  return {
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
  };
}
