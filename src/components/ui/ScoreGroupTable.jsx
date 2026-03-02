import React, { useMemo, useState } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import { computeGroupScoreSnapshot } from "../../utils/groupScoreStats";

const formatPercent = (value) => {
  if (!Number.isFinite(value)) return "--";
  return `${value.toFixed(0)}%`;
};

const ScorePill = ({ value }) => (
  <span className="inline-flex min-w-[62px] items-center justify-center rounded-[20px] border border-violet-200 bg-violet-50 px-2 py-1 text-[11px] font-semibold text-violet-700">
    {formatPercent(value)}
  </span>
);

const ScoreGroupTable = ({
  currentScore,
  peerScores,
  groupLabel = "All Devices",
  minScore = 80,
  maxScore = 98,
  scoreLabel = "Spec Score",
  labels = {},
  className = "",
  defaultOpen = false,
  isOpen: controlledOpen,
  onToggle,
  showHeader = true,
}) => {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = typeof controlledOpen === "boolean";
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const handleToggle = () => {
    if (typeof onToggle === "function") {
      onToggle(!isOpen);
      return;
    }
    setInternalOpen((prev) => !prev);
  };
  const snapshot = useMemo(
    () =>
      computeGroupScoreSnapshot({
        currentScore,
        peerScores,
        minScore,
        maxScore,
      }),
    [currentScore, peerScores, minScore, maxScore],
  );

  const rows = [
    {
      label: labels.current || "Current Pick",
      value: snapshot.current,
    },
    {
      label: labels.average || "Segment Average",
      value: snapshot.average,
    },
    {
      label: labels.best || "Segment Leader",
      value: snapshot.best,
    },
  ];

  if (!showHeader && !isOpen) return null;

  return (
    <div className={`mt-2 border border-gray-200 bg-gray-50/50 ${className}`}>
      {showHeader ? (
        <div className="flex items-center justify-between px-3 py-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-600">
            Score Snapshot
          </span>
          <button
            type="button"
            onClick={handleToggle}
            className="inline-flex items-center gap-1 rounded border border-violet-200 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-violet-700 hover:bg-violet-50"
            aria-expanded={isOpen}
            aria-label={isOpen ? "Hide score benchmark" : "Show score benchmark"}
          >
            <span>{isOpen ? "Hide" : "Show"}</span>
            {isOpen ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
          </button>
        </div>
      ) : null}
      {isOpen ? (
        <>
          <div className="grid grid-cols-[1fr_auto] border-y border-gray-200 bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-600">
            <span>Benchmark</span>
            <span>{scoreLabel}</span>
          </div>
          <div className="divide-y divide-gray-100 bg-white">
            {rows.map((row) => (
              <div
                key={row.label}
                className="grid grid-cols-[1fr_auto] items-center gap-3 px-3 py-1.5"
              >
                <span className="text-[12px] font-medium text-gray-700">
                  {row.label}
                </span>
                <ScorePill value={row.value} />
              </div>
            ))}
          </div>
          <div className="border-t border-gray-200 bg-gray-50 px-3 py-1 text-[10px] text-gray-500">
            Based on device specifications and profile scoring.
          </div>
        </>
      ) : null}
    </div>
  );
};

export default ScoreGroupTable;
