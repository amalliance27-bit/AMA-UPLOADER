import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Link2,
  Copy,
  Check,
  QrCode,
  Shield,
  Key,
  Folder,
  Eye,
  Pause,
  Play,
  Clock,
  Trash2,
  ExternalLink,
  Edit2,
  Sparkles,
} from 'lucide-react';
import { ClientProfile } from '../types/vault';

interface ClientManagerProps {
  clients: ClientProfile[];
  onSelectClient: (clientId: string) => void;
  onOpenClientUpload: (client: ClientProfile) => void;
  onAddClient: (newClient: Omit<ClientProfile, 'id' | 'createdAt' | 'totalUploads' | 'websiteReadyCount'>) => void;
  onUpdateClient: (updated: ClientProfile) => void;
  onDeleteClient: (clientId: string) => void;
}

export const ClientManager: React.FC<ClientManagerProps> = ({
  clients,
  onSelectClient,
  onOpenClientUpload,
  onAddClient,
  onUpdateClient,
  onDeleteClient,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [qrModalClient, setQrModalClient] = useState<ClientProfile | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editClient, setEditClient] = useState<ClientProfile | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [notes, setNotes] = useState('');

  const handleCopyLink = (client: ClientProfile) => {
    const url = `${window.location.origin}${window.location.pathname}?client=${client.slug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(client.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getClientUploadUrl = (client: ClientProfile) => {
    return `${window.location.origin}${window.location.pathname}?client=${client.slug}`;
  };

  const handleNameChange = (val: string) => {
    setName(val);
    setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''));
  };

  const submitAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddClient({
      name: name.trim(),
      slug: slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      accessCode: accessCode.trim() || undefined,
      status: 'active',
      notes: notes.trim() || undefined,
    });

    setName('');
    setSlug('');
    setAccessCode('');
    setNotes('');
    setAddModalOpen(false);
  };

  const submitEditClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editClient) return;

    onUpdateClient(editClient);
    setEditClient(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#11141c]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-red-500" />
            <span>Private Client Portals</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Generate isolated upload portals for Jeannie and other clients with automatic Drive routing and security controls.
          </p>
        </div>

        <button
          onClick={() => setAddModalOpen(true)}
          className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white font-semibold text-xs rounded-xl shadow-lg shadow-red-500/20 transition cursor-pointer flex items-center gap-2 shrink-0 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Create New Client</span>
        </button>
      </div>

      {/* Clients Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {clients.map((client) => {
          const uploadUrl = getClientUploadUrl(client);
          return (
            <div
              key={client.id}
              className="bg-[#11141c]/90 border border-white/10 hover:border-white/20 rounded-2xl p-5 space-y-4 flex flex-col justify-between transition-all duration-200 shadow-xl"
            >
              <div className="space-y-3">
                {/* Top status & actions */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-tight">
                      {client.name}
                    </h3>
                    <p className="text-xs font-mono text-slate-400">/{client.slug}</p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Status badge */}
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        client.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : client.status === 'paused'
                          ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}
                    >
                      {client.status}
                    </span>
                    {client.accessCode && (
                      <span
                        className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold flex items-center gap-1"
                        title={`Protected with PIN: ${client.accessCode}`}
                      >
                        <Shield className="w-3 h-3" /> PIN
                      </span>
                    )}
                  </div>
                </div>

                {client.notes && (
                  <p className="text-xs text-slate-400 line-clamp-2">{client.notes}</p>
                )}

                {/* Metrics snapshot */}
                <div className="grid grid-cols-2 gap-2 bg-[#090b0e] border border-white/5 rounded-xl p-2.5 text-center">
                  <div>
                    <span className="text-base font-bold text-white block">
                      {client.totalUploads}
                    </span>
                    <span className="text-[10px] uppercase text-slate-500 tracking-wider">
                      Uploads
                    </span>
                  </div>
                  <div>
                    <span className="text-base font-bold text-emerald-400 block">
                      {client.websiteReadyCount}
                    </span>
                    <span className="text-[10px] uppercase text-slate-500 tracking-wider">
                      Website JPGs
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-white/5 text-xs">
                {/* Launch client portal button */}
                <button
                  onClick={() => onOpenClientUpload(client)}
                  className="w-full py-2.5 bg-white/10 hover:bg-white/15 text-white font-medium rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Open Client Upload Page</span>
                </button>

                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => handleCopyLink(client)}
                    className="py-2 bg-[#090b0e] hover:bg-white/5 border border-white/10 rounded-xl text-slate-300 font-medium transition flex items-center justify-center gap-1 cursor-pointer"
                    title="Copy Private Link"
                  >
                    {copiedId === client.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedId === client.id ? 'Copied' : 'Link'}</span>
                  </button>

                  <button
                    onClick={() => setQrModalClient(client)}
                    className="py-2 bg-[#090b0e] hover:bg-white/5 border border-white/10 rounded-xl text-slate-300 font-medium transition flex items-center justify-center gap-1 cursor-pointer"
                    title="View QR Code"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>QR</span>
                  </button>

                  <button
                    onClick={() => {
                      const nextStatus =
                        client.status === 'active'
                          ? 'paused'
                          : client.status === 'paused'
                          ? 'expired'
                          : 'active';
                      onUpdateClient({ ...client, status: nextStatus });
                    }}
                    className="py-2 bg-[#090b0e] hover:bg-white/5 border border-white/10 rounded-xl text-slate-300 font-medium transition flex items-center justify-center gap-1 cursor-pointer"
                    title="Toggle Status (Active/Paused/Expired)"
                  >
                    {client.status === 'active' ? (
                      <Pause className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <Play className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                    <span>Status</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Client Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#11141c] border border-white/15 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150">
            <h3 className="text-xl font-bold text-white">Create New Client Vault</h3>
            <form onSubmit={submitAddClient} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-medium">Client Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jeannie or Apex Studio"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full bg-[#090b0e] border border-white/15 rounded-xl p-3 text-white text-sm outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-medium">URL Slug</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. jeannie"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full bg-[#090b0e] border border-white/15 rounded-xl p-3 text-white text-sm font-mono outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-medium">
                  Optional Access PIN / Passcode
                </label>
                <input
                  type="text"
                  placeholder="e.g. 4827 (Leave empty for instant access)"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  className="w-full bg-[#090b0e] border border-white/15 rounded-xl p-3 text-white text-sm outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-medium">Project Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Lookbook 2026 website imagery"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#090b0e] border border-white/15 rounded-xl p-3 text-white text-sm outline-none focus:border-red-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white font-semibold shadow-lg shadow-red-500/25 cursor-pointer"
                >
                  Create Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code / Mobile Share Modal */}
      {qrModalClient && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#11141c] border border-white/15 rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Scan from Phone</h3>
            <p className="text-xs text-slate-400">
              Open the camera on your phone or send this link directly to{' '}
              <strong className="text-white">{qrModalClient.name}</strong>.
            </p>

            <div className="bg-white p-4 rounded-2xl mx-auto w-48 h-48 flex items-center justify-center shadow-lg">
              {/* QR Image API */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                  getClientUploadUrl(qrModalClient)
                )}`}
                alt="QR Code"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="bg-[#090b0e] p-2.5 rounded-xl text-xs font-mono text-slate-300 truncate">
              {getClientUploadUrl(qrModalClient)}
            </div>

            <button
              onClick={() => setQrModalClient(null)}
              className="w-full py-2.5 bg-white/10 hover:bg-white/15 text-white font-medium rounded-xl text-xs cursor-pointer transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
