// src/pages/OrderStatusPage.tsx
// Tableau de bord commande — vendeur et acheteur
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  subscribeToOrder, confirmPaymentReceived,
  confirmDelivery, openOrderDispute, getCountdown,
  subscribeUserOrders, checkExpiredOrders,
} from '@/services/orderService';
import { Order, OrderStatus, MOBILE_PAYMENT_METHODS } from '@/types';

interface OrderStatusPageProps {
  orderId?: string;    // si on ouvre une commande précise
  onBack: () => void;
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const map: Record<OrderStatus, { label: string; bg: string; color: string }> = {
    initiated:  { label: 'Initié',            bg: '#FEF3C7', color: '#92400E' },
    proof_sent: { label: 'Preuve envoyée',     bg: '#DBEAFE', color: '#1D4ED8' },
    confirmed:  { label: 'Paiement confirmé',  bg: '#D1FAE5', color: '#065F46' },
    delivered:  { label: 'Livré ✓',           bg: '#DCFCE7', color: '#166534' },
    disputed:   { label: '⚠️ Litige',          bg: '#FFEDD5', color: '#9A3412' },
    cancelled:  { label: 'Annulé',             bg: '#F3F4F6', color: '#374151' },
  };
  const s = map[status] || map.initiated;
  return (
    <span className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest"
      style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

function Countdown({ deadline, label }: { deadline: any; label: string }) {
  const [text, setText] = useState('');
  useEffect(() => {
    setText(getCountdown(deadline));
    const t = setInterval(() => setText(getCountdown(deadline)), 30000);
    return () => clearInterval(t);
  }, [deadline]);
  if (!deadline || !text || text === 'Expiré') return null;
  return (
    <div className="bg-orange-50 border border-orange-100 rounded-2xl px-4 py-3 flex items-center gap-3">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EA580C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      <p className="text-[11px] font-black text-orange-800">
        {label} <span className="text-orange-600">{text}</span>
      </p>
    </div>
  );
}

// ── Vue détail d'une commande ─────────────────────────────
function OrderDetail({ orderId, onBack }: { orderId: string; onBack: () => void }) {
  const { currentUser } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return subscribeToOrder(orderId, setOrder);
  }, [orderId]);

  if (!order || !currentUser) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-green-200 border-t-green-600 rounded-full animate-spin" />
    </div>
  );

  const isBuyer  = order.buyerId  === currentUser.uid;
  const isSeller = order.sellerId === currentUser.uid;
  const method = MOBILE_PAYMENT_METHODS.find(m => m.id === order.paymentInfo?.method);

  const handleConfirmReceived = async () => {
    setLoading(true);
    await confirmPaymentReceived(orderId);
    setLoading(false);
  };

  const handleConfirmDelivery = async () => {
    setLoading(true);
    await confirmDelivery(orderId);
    setLoading(false);
  };

  const handleDispute = async () => {
    if (!disputeReason.trim()) return;
    setLoading(true);
    await openOrderDispute(orderId, disputeReason);
    setShowDisputeForm(false);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white pb-24 font-sans">
      <div className="sticky top-0 bg-white/95 backdrop-blur-md px-5 py-5 flex items-center gap-4 border-b border-slate-100 z-40">
        <button onClick={onBack} className="w-11 h-11 bg-slate-50 rounded-2xl flex items-center justify-center active:scale-90 transition-all">
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" stroke="#0F0F0F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <div className="flex-1">
          <h1 className="font-black text-slate-900 text-base uppercase tracking-tight truncate">{order.productTitle}</h1>
          <div className="mt-1"><StatusBadge status={order.status} /></div>
        </div>
      </div>

      <div className="px-5 py-6 space-y-5">
        {/* Produit + montants */}
        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-3xl">
          <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0">
            <img src={order.productImage} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1">
            <p className="font-black text-slate-900 text-sm">{order.productTitle}</p>
            <p className="text-green-600 font-black text-lg">{order.productPrice.toLocaleString('fr-FR')} FCFA</p>
            {isSeller && (
              <p className="text-[10px] text-slate-500 font-bold">
                Tu reçois : <span className="text-green-700">{order.sellerReceives.toLocaleString('fr-FR')} FCFA</span>
                <span className="text-slate-400 ml-1">(après 5% Brumerie)</span>
              </p>
            )}
          </div>
        </div>

        {/* Compte à rebours si proof_sent */}
        {order.status === 'proof_sent' && isSeller && (
          <Countdown deadline={order.autoDisputeAt} label="⏳ Il vous reste" />
        )}

        {/* Stepper visuel */}
        <div className="space-y-3">
          {[
            { key: 'initiated',  label: '🛍️ Commande initiée',       done: true },
            { key: 'proof_sent', label: '📸 Preuve envoyée',          done: ['proof_sent','confirmed','delivered','disputed'].includes(order.status) },
            { key: 'confirmed',  label: '✅ Paiement confirmé',       done: ['confirmed','delivered'].includes(order.status) },
            { key: 'delivered',  label: '📦 Livraison confirmée',     done: order.status === 'delivered' },
          ].map((s, i) => (
            <div key={s.key} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${s.done ? 'bg-green-500' : 'bg-slate-100'}`}>
                {s.done
                  ? <svg width="14" height="14" fill="none" stroke="white" strokeWidth="3"><path d="M11 4L5 10l-3-3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  : <span className="text-[10px] font-black text-slate-400">{i+1}</span>}
              </div>
              <p className={`text-[12px] font-${s.done ? 'black' : 'medium'} ${s.done ? 'text-slate-900' : 'text-slate-400'}`}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Preuve uploadée */}
        {order.proof && (
          <div className="space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Preuve de paiement</p>
            <div className="rounded-2xl overflow-hidden bg-slate-50 border border-slate-100">
              <img src={order.proof.screenshotUrl} alt="Preuve" className="w-full object-contain max-h-48" />
            </div>
            <div className="bg-slate-50 rounded-xl px-4 py-3 flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-bold">Référence transaction</span>
              <span className="font-black text-slate-900 text-[12px] font-mono">{order.proof.transactionRef}</span>
            </div>
          </div>
        )}

        {/* Coordonnées paiement (rappel pour vendeur) */}
        {isSeller && order.paymentInfo && (
          <div className="bg-slate-50 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: (method?.color || '#000') + '20' }}>
              {method?.icon}
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">{method?.name}</p>
              <p className="font-black text-slate-900">{order.paymentInfo.phone}</p>
            </div>
          </div>
        )}

        {/* ── ACTIONS VENDEUR ── */}
        {isSeller && order.status === 'proof_sent' && (
          <div className="space-y-3 pt-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Action requise</p>
            <button onClick={handleConfirmReceived} disabled={loading}
              className="w-full py-5 rounded-2xl font-black text-[12px] uppercase tracking-widest text-white shadow-xl shadow-green-200 active:scale-95 transition-all disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #16A34A, #115E2E)' }}>
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : "J'ai reçu le paiement ✓"}
            </button>
            <button onClick={() => setShowDisputeForm(true)}
              className="w-full py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest text-orange-600 bg-orange-50 border border-orange-100 active:scale-95 transition-all">
              Signaler un problème
            </button>
          </div>
        )}

        {/* ── ACTIONS ACHETEUR ── */}
        {isBuyer && order.status === 'confirmed' && (
          <div className="space-y-3 pt-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avez-vous reçu l'article ?</p>
            <button onClick={handleConfirmDelivery} disabled={loading}
              className="w-full py-5 rounded-2xl font-black text-[12px] uppercase tracking-widest text-white shadow-xl shadow-blue-200 active:scale-95 transition-all"
              style={{ background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' }}>
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : "J'ai reçu l'article ✓"}
            </button>
            <button onClick={() => setShowDisputeForm(true)}
              className="w-full py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest text-orange-600 bg-orange-50 border border-orange-100 active:scale-95 transition-all">
              Signaler un problème
            </button>
          </div>
        )}

        {isBuyer && order.status === 'proof_sent' && (
          <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
            <p className="text-[11px] text-blue-800 font-bold">
              ⏳ En attente de confirmation du vendeur. Il a 24h pour confirmer la réception.
            </p>
          </div>
        )}

        {order.status === 'disputed' && (
          <div className="bg-orange-50 rounded-2xl p-5 border border-orange-200">
            <p className="font-black text-orange-900 text-[12px] uppercase mb-2">⚠️ Litige en cours</p>
            <p className="text-[11px] text-orange-800 font-medium leading-relaxed">
              L'équipe Brumerie examine ce dossier. Vous serez contacté par WhatsApp ou email sous 48h.
            </p>
            {order.disputeReason && (
              <p className="text-[10px] text-orange-600 font-bold mt-2">Motif : {order.disputeReason}</p>
            )}
          </div>
        )}

        {order.status === 'delivered' && (
          <div className="bg-green-50 rounded-2xl p-5 border border-green-100 text-center">
            <p className="text-3xl mb-2">🎉</p>
            <p className="font-black text-green-900 text-[13px] uppercase tracking-tight">Transaction terminée !</p>
            <p className="text-[11px] text-green-700 font-medium mt-1">Merci d'utiliser Brumerie.</p>
          </div>
        )}
      </div>

      {/* Modal signalement */}
      {showDisputeForm && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[200] flex items-end justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-8 space-y-5">
            <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto" />
            <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight text-center">Signaler un problème</h3>
            <textarea
              value={disputeReason}
              onChange={e => setDisputeReason(e.target.value)}
              placeholder="Décrivez le problème rencontré..."
              rows={4}
              className="w-full bg-slate-50 rounded-2xl px-4 py-3 text-[13px] border-2 border-transparent focus:border-orange-400 outline-none resize-none"
            />
            <div className="flex flex-col gap-3">
              <button onClick={handleDispute} disabled={!disputeReason.trim() || loading}
                className="w-full py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest text-white bg-orange-500 shadow-lg shadow-orange-200 active:scale-95 disabled:opacity-50 transition-all">
                Envoyer le signalement
              </button>
              <button onClick={() => setShowDisputeForm(false)}
                className="w-full py-3 text-slate-400 font-bold text-[11px] uppercase tracking-widest">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Liste toutes mes commandes ─────────────────────────────
export function OrderStatusPage({ orderId, onBack }: OrderStatusPageProps) {
  const { currentUser, userProfile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState(orderId || '');

  const role = userProfile?.role || 'buyer';

  useEffect(() => {
    if (!currentUser) return;
    // Vérifier commandes expirées au chargement (vendeur)
    if (role === 'seller') checkExpiredOrders(currentUser.uid);

    const unsub = subscribeUserOrders(currentUser.uid, role, (ords) => {
      setOrders(ords);
      setLoading(false);
    });
    return unsub;
  }, [currentUser, role]);

  if (selectedOrderId) {
    return <OrderDetail orderId={selectedOrderId} onBack={() => setSelectedOrderId('')} />;
  }

  return (
    <div className="min-h-screen bg-white pb-24 font-sans">
      <div className="sticky top-0 bg-white/95 backdrop-blur-md px-5 py-5 flex items-center gap-4 border-b border-slate-100 z-40">
        <button onClick={onBack} className="w-11 h-11 bg-slate-50 rounded-2xl flex items-center justify-center active:scale-90 transition-all">
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" stroke="#0F0F0F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <h1 className="font-black text-slate-900 text-base uppercase tracking-tight">Mes commandes</h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center pt-32">
          <div className="w-8 h-8 border-2 border-green-200 border-t-green-600 rounded-full animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center pt-32 px-10 text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg>
          </div>
          <p className="font-black text-slate-900 uppercase tracking-tight text-lg mb-2">Aucune commande</p>
          <p className="text-slate-400 text-[11px]">Vos transactions apparaîtront ici.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-50 mt-2">
          {orders.map(order => (
            <button key={order.id} onClick={() => setSelectedOrderId(order.id)}
              className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50 active:bg-slate-100 transition-all text-left">
              <div className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0 bg-slate-100">
                <img src={order.productImage} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-slate-900 text-[12px] truncate">{order.productTitle}</p>
                <p className="text-green-600 font-bold text-[11px]">{order.productPrice.toLocaleString('fr-FR')} FCFA</p>
                <div className="mt-1"><StatusBadge status={order.status} /></div>
              </div>
              {/* Badge action requise */}
              {((role === 'seller' && order.status === 'proof_sent') ||
                (role === 'buyer'  && order.status === 'confirmed')) && (
                <div className="w-3 h-3 bg-orange-500 rounded-full flex-shrink-0 animate-pulse" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
