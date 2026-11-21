import React, { useState } from 'react';
import {
  Camera,
  CheckCircle2,
  Hammer,
  Image as ImageIcon,
} from 'lucide-react';
import { FormError } from '../components/FormError';
import { FurnitureIllustration } from '../components/FurnitureIllustration';
import { ProductionTimeline } from '../components/ProductionTimeline';
import { PredictiveBackButton, SwipeableSheet } from '../components/UxOverlays';
import {
  PRODUCTION_STAGES,
  getNextProductionStage,
  sortProductionQueue,
  validateStageTransition,
} from '../logic/workshopRules';
import type {
  MilestonePhoto,
  Order,
  ProductionStage,
} from '../types/saw2sale';

interface ProductionScreenProps {
  orders: Order[];
  photos: MilestonePhoto[];
  selectedJobJo: string | null;
  onSelectJob: (joNumber: string | null) => void;
  onAdvanceStage: (params: {
    joNumber: string;
    targetStage: ProductionStage;
    note: string;
    includePhoto: boolean;
    photoCaption: string;
  }) => void;
}

export const ProductionScreen: React.FC<ProductionScreenProps> = ({
  orders,
  photos,
  selectedJobJo,
  onSelectJob,
  onAdvanceStage,
}) => {
  const [subView, setSubView] = useState<'queue' | 'gallery'>('queue');
  const [stageFilter, setStageFilter] = useState<'All' | ProductionStage>('All');
  const [showAdvanceSheet, setShowAdvanceSheet] = useState(false);

  // Advance sheet state
  const selectedOrder = orders.find((o) => o.joNumber === selectedJobJo);
  const nextStageDefault = selectedOrder
    ? getNextProductionStage(selectedOrder.stage) ?? 'Ready'
    : 'Cutting';

  const [targetStage, setTargetStage] =
    useState<ProductionStage>(nextStageDefault);
  const [noteText, setNoteText] = useState('');
  const [attachPhoto, setAttachPhoto] = useState(true);
  const [photoCaption, setPhotoCaption] = useState('');
  const [advanceError, setAdvanceError] = useState<string | null>(null);
  const [advanceSuccessMsg, setAdvanceSuccessMsg] = useState<string | null>(
    null,
  );

  const openAdvanceFor = (order: Order) => {
    const next = getNextProductionStage(order.stage);
    setTargetStage(next ?? 'Ready');
    setNoteText('');
    setPhotoCaption(`${order.specs.piece} — ${next ?? 'Ready'} milestone`);
    setAdvanceError(null);
    setAdvanceSuccessMsg(null);
    setShowAdvanceSheet(true);
  };

  // Job Status Screen
  if (selectedOrder) {
    const jobPhotos = photos.filter(
      (p) => p.joNumber === selectedOrder.joNumber,
    );
    const currentIdx = selectedOrder.stage
      ? PRODUCTION_STAGES.indexOf(selectedOrder.stage)
      : -1;
    const nextStage = getNextProductionStage(selectedOrder.stage);

    const handleConfirmAdvance = (e: React.FormEvent) => {
      e.preventDefault();
      const validation = validateStageTransition(
        selectedOrder.stage,
        targetStage,
      );
      if (!validation.valid) {
        setAdvanceError(validation.error ?? 'Invalid stage transition.');
        return;
      }
      if (!noteText.trim()) {
        setAdvanceError('Add a short workshop milestone note before advancing.');
        return;
      }
      setAdvanceError(null);
      onAdvanceStage({
        joNumber: selectedOrder.joNumber,
        targetStage,
        note: noteText.trim(),
        includePhoto: attachPhoto,
        photoCaption:
          photoCaption.trim() || `${selectedOrder.specs.piece} — ${targetStage}`,
      });
      setShowAdvanceSheet(false);
      setAdvanceSuccessMsg(`Status updated to ${targetStage}.`);
    };

    return (
      <div className="space-y-6 w-full">
        <div className="flex items-center justify-between">
          <PredictiveBackButton
            label="Back to Queue"
            onBack={() => {
              setShowAdvanceSheet(false);
              setAdvanceSuccessMsg(null);
              onSelectJob(null);
            }}
          />
          <div className="font-code text-xs text-[#5C5446]">
            Queue #{selectedOrder.queuePosition ?? '-'} ·{' '}
            {selectedOrder.joNumber}
          </div>
        </div>

        {advanceSuccessMsg && (
          <div
            role="status"
            className="p-4 continuous-control bg-[#1F6B43]/15 border border-[#1F6B43]/30 text-sm font-semibold text-[#1F6B43] flex items-center gap-2.5"
          >
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{advanceSuccessMsg}</span>
          </div>
        )}

        <div className="glass-clear continuous-card p-4 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <FurnitureIllustration
                kind={selectedOrder.specs.furnitureKind}
                stage={selectedOrder.stage}
                size="md"
              />
              <div className="min-w-0 break-words">
                <h2 className="text-xl sm:text-2xl text-[#1B1712] break-words">
                  {selectedOrder.specs.piece}
                </h2>
                <div className="text-sm text-[#4A4237] break-words">
                  {selectedOrder.customerName} · Due {selectedOrder.promisedDate}
                </div>
                <div className="text-xs text-[#5C5446] mt-0.5 break-words">
                  {selectedOrder.specs.woodSpecies} ·{' '}
                  {selectedOrder.specs.finishNotes}
                </div>
              </div>
            </div>

            {nextStage ? (
              !showAdvanceSheet && (
                <button
                  type="button"
                  onClick={() => openAdvanceFor(selectedOrder)}
                  title={`Update status to ${nextStage}`}
                  className="btn-scale w-full sm:w-auto h-12 px-5 rounded-xl bg-[#8A3B12] hover:bg-[#702F0D] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 shrink-0"
                >
                  <Hammer className="w-4 h-4" />
                  Update Status
                </button>
              )
            ) : (
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1F6B43]">
                <CheckCircle2 className="w-4 h-4" />
                Ready for Delivery
              </span>
            )}
          </div>

          {/* 5-Stage Timeline */}
          <ProductionTimeline currentStage={selectedOrder.stage} />

          {/* Interruptible Swipe-to-Dismiss Update Status Sheet */}
          <SwipeableSheet
            open={showAdvanceSheet}
            title="Update Production Status"
            subtitle={`Current: ${selectedOrder.stage} · Sequential progression enforced`}
            onClose={() => setShowAdvanceSheet(false)}
          >
            <form
              onSubmit={handleConfirmAdvance}
              className="space-y-4"
              noValidate
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="adv-target-stage"
                    className="block text-xs font-semibold text-[#4A4237] mb-1.5"
                  >
                    Target Stage (Sequential Only)
                  </label>
                  <select
                    id="adv-target-stage"
                    value={targetStage}
                    onChange={(e) => {
                      setTargetStage(e.target.value as ProductionStage);
                      setAdvanceError(null);
                    }}
                    className="w-full h-11 px-3 rounded-lg bg-white border border-[#D9D2C3] text-sm text-[#1B1712]"
                  >
                    {PRODUCTION_STAGES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end pb-1">
                  <label className="inline-flex items-center gap-2 text-sm font-semibold text-[#1B1712] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={attachPhoto}
                      onChange={(e) => setAttachPhoto(e.target.checked)}
                      className="w-4 h-4 accent-[#8A3B12]"
                    />
                    <Camera className="w-4 h-4 text-[#8A3B12]" />
                    Upload milestone photo to Gallery
                  </label>
                </div>
              </div>

              <div>
                <label
                  htmlFor="adv-note"
                  className="block text-xs font-semibold text-[#4A4237] mb-1.5"
                >
                  Milestone Note
                </label>
                <input
                  id="adv-note"
                  type="text"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Describe joinery check, sanding grit, or finish coat…"
                  className="w-full h-11 px-3.5 rounded-lg bg-white border border-[#D9D2C3] text-sm text-[#1B1712]"
                />
              </div>

              {attachPhoto && (
                <div>
                  <label
                    htmlFor="adv-photo-caption"
                    className="block text-xs font-semibold text-[#4A4237] mb-1.5"
                  >
                    Milestone Photo Caption
                  </label>
                  <input
                    id="adv-photo-caption"
                    type="text"
                    value={photoCaption}
                    onChange={(e) => setPhotoCaption(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-lg bg-white border border-[#D9D2C3] text-sm text-[#1B1712]"
                  />
                </div>
              )}

              <FormError message={advanceError} />

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdvanceSheet(false)}
                  className="h-10 px-4 rounded-xl border border-[#D9D2C3] bg-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-10 px-5 rounded-xl bg-[#8A3B12] hover:bg-[#702F0D] text-white text-xs font-semibold"
                >
                  Confirm Update
                </button>
              </div>
            </form>
          </SwipeableSheet>

          {/* Notes & Photos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-[#D9D2C3]">
            <div className="space-y-3">
              <h3 className="text-lg font-display text-[#1B1712]">
                Workshop Notes
              </h3>
              {selectedOrder.notes.length === 0 ? (
                <p className="text-sm text-[#5C5446]">No notes logged yet.</p>
              ) : (
                <div className="space-y-3">
                  {selectedOrder.notes.map((n) => (
                    <div
                      key={n.id}
                      className="p-3.5 rounded-2xl bg-white/70 border border-[#D9D2C3]"
                    >
                      <div className="flex items-center justify-between text-xs text-[#5C5446]">
                        <span className="font-semibold text-[#8A3B12]">
                          {n.stage}
                        </span>
                        <span className="tabular-nums">{n.timestamp}</span>
                      </div>
                      <div className="text-sm text-[#1B1712] mt-1">
                        {n.note}
                      </div>
                      <div className="text-xs text-[#5C5446] mt-1">
                        {n.author}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-display text-[#1B1712]">
                Job Milestone Photos
              </h3>
              {jobPhotos.length === 0 ? (
                <p className="text-sm text-[#5C5446]">
                  No milestone photos uploaded yet.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {jobPhotos.map((ph) => (
                    <div
                      key={ph.id}
                      className="p-2.5 rounded-2xl bg-white/70 border border-[#D9D2C3] space-y-2"
                    >
                      <FurnitureIllustration
                        kind={ph.furnitureKind}
                        stage={ph.stage}
                        size="lg"
                        className="h-24"
                      />
                      <div className="text-xs font-semibold text-[#1B1712]">
                        {ph.stage}
                      </div>
                      <div className="text-xs text-[#4A4237]">{ph.caption}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Queue vs Gallery switcher
  const queueJobs = sortProductionQueue(orders).filter(
    (o) => stageFilter === 'All' || o.stage === stageFilter,
  );

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div
          role="tablist"
          aria-label="Production views"
          className="inline-flex items-center gap-1 p-1 rounded-xl glass-frosted overflow-x-auto max-w-full"
        >
          <button
            type="button"
            role="tab"
            aria-selected={subView === 'queue'}
            onClick={() => setSubView('queue')}
            className={`h-9 px-3.5 sm:px-4 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              subView === 'queue'
                ? 'bg-[#1B1712] text-white'
                : 'text-[#4A4237] hover:text-[#1B1712]'
            }`}
          >
            <Hammer className="w-3.5 h-3.5" />
            Production Queue
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={subView === 'gallery'}
            onClick={() => setSubView('gallery')}
            className={`h-9 px-3.5 sm:px-4 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              subView === 'gallery'
                ? 'bg-[#1B1712] text-white'
                : 'text-[#4A4237] hover:text-[#1B1712]'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            Milestone Gallery ({photos.length})
          </button>
        </div>

        {subView === 'queue' && (
          <div className="flex items-center gap-2 flex-wrap">
            {(['All', ...PRODUCTION_STAGES] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStageFilter(st)}
                aria-pressed={stageFilter === st}
                className={`h-9 px-3 rounded-xl text-xs font-semibold whitespace-nowrap ${
                  stageFilter === st
                    ? 'bg-[#8A3B12] text-white'
                    : 'glass-frosted text-[#4A4237] hover:text-[#1B1712]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        )}
      </div>

      {subView === 'gallery' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
          {photos.map((ph) => (
            <button
              key={ph.id}
              type="button"
              onClick={() => onSelectJob(ph.joNumber)}
              className="w-full glass-clear continuous-card p-4 text-left space-y-3 hover:bg-white/60 transition-colors"
            >
              <FurnitureIllustration
                kind={ph.furnitureKind}
                stage={ph.stage}
                size="lg"
              />
              <div className="min-w-0 break-words">
                <div className="flex items-center justify-between text-xs gap-2">
                  <span className="font-code text-[#8A3B12]">
                    {ph.joNumber}
                  </span>
                  <span className="text-[#5C5446] tabular-nums">
                    {ph.capturedAt}
                  </span>
                </div>
                <div className="text-sm font-semibold text-[#1B1712] mt-1 break-words">
                  {ph.caption}
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="w-full glass-clear continuous-card divide-y divide-[#D9D2C3]/70">
          {queueJobs.map((job) => {
            const stageIdx = job.stage
              ? PRODUCTION_STAGES.indexOf(job.stage)
              : 0;
            const progressPct = Math.round(((stageIdx + 1) / 5) * 100);
            return (
              <div
                key={job.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <button
                  type="button"
                  onClick={() => onSelectJob(job.joNumber)}
                  className="flex items-center gap-4 text-left flex-1 min-w-0 w-full group"
                >
                  <FurnitureIllustration
                    kind={job.specs.furnitureKind}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1 space-y-1.5 break-words">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-code text-xs text-[#5C5446]">
                        Queue #{job.queuePosition} · {job.joNumber}
                      </span>
                      <span className="text-xs font-semibold text-[#8A3B12]">
                        {job.stage}
                      </span>
                    </div>
                    <div className="text-base font-semibold text-[#1B1712] group-hover:text-[#8A3B12] break-words">
                      {job.specs.piece}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                      <div className="w-full sm:w-48 max-w-full h-2 rounded-full bg-[#D9D2C3] overflow-hidden shrink-0">
                        <div
                          className="h-full bg-[#8A3B12]"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <span className="text-xs text-[#5C5446] tabular-nums break-words">
                        {job.customerName} · Due {job.promisedDate}
                      </span>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectJob(job.joNumber)}
                  title={`Open ${job.joNumber} to update status`}
                  className="btn-scale w-full sm:w-auto h-11 px-4 rounded-xl bg-[#1B1712] hover:bg-[#332C24] text-white text-xs font-semibold whitespace-nowrap shrink-0"
                >
                  Update Status
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
