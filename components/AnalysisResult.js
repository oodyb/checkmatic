// components/AnalysisResult.js
import React, { useState, useEffect } from 'react';
import {
  FaRegNewspaper,
  FaClipboardCheck,
  FaBalanceScale,
  FaCheckCircle,
  FaExclamationTriangle,
  FaListAlt,
  FaChevronDown,
  FaCopy,
  FaShare,
} from 'react-icons/fa';

export default function AnalysisResult({ analysis }) {
  const [expandedSections, setExpandedSections] = useState({
    summary: true,
    credibility: true,
    type: true,
    bias: true,
  });
  const [animateIn, setAnimateIn] = useState(false);
  const [copiedSection, setCopiedSection] = useState(null);

  useEffect(() => {
    if (analysis?.synthesis) {
      // Slight delay for smoother entrance animation
      setTimeout(() => setAnimateIn(true), 100);
    }
  }, [analysis]);

  if (!analysis?.synthesis || analysis.synthesis.error) {
    return (
      <div className="w-full max-w-2xl mx-auto mt-8 p-6 text-center text-gray-500 dark:text-gray-400">
        <div className="space-y-4 animate-pulse">
          <div className="bg-gray-200 dark:bg-gray-700 h-6 w-3/4 mx-auto rounded-lg"></div>
          <div className="bg-gray-200 dark:bg-gray-700 h-4 w-1/2 mx-auto rounded-lg"></div>
        </div>
      </div>
    );
  }

  const {
    summary,
    primary_classification,
    secondary_classification,
    tertiary_classification,
  } = analysis.synthesis;

  const toggleSection = (section) =>
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));

  const toggleAllSections = () => {
    const allExpanded = Object.values(expandedSections).every(Boolean);
    const newState = !allExpanded;
    setExpandedSections({
      summary: newState,
      credibility: newState,
      type: newState,
      bias: newState,
    });
  };

  const copyToClipboard = async (text, section) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedSection(section);
      setTimeout(() => setCopiedSection(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const shareAnalysis = async () => {
    const currentUrl = window.location.href;
    const fullReport = `Analysis Report

URL: ${currentUrl}

Summary: "${summary}"

Credibility: ${primary_classification?.type?.replace('_', ' ')}
Quote: "${primary_classification?.quote}"

Type: ${secondary_classification?.type?.replace('_', ' ')}
Quote: "${secondary_classification?.quote}"

${tertiary_classification
        ? `Political Bias: ${tertiary_classification.type.replace('_', ' ')}
Quote: "${tertiary_classification.quote}"`
        : ''
      }`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Analysis Report',
          text: fullReport,
          url: currentUrl,
        });
        return;
      } catch {
        // Fall through to copy on cancel
      }
    }
    copyToClipboard(fullReport, 'share');
  };

  const getSectionText = (sectionKey) => {
    const textMap = {
      summary: `Summary: "${summary}"`,
      credibility: `Credibility: ${primary_classification?.type?.replace('_', ' ')}\nQuote: "${primary_classification?.quote}"`,
      type: `Type: ${secondary_classification?.type?.replace('_', ' ')}\nQuote: "${secondary_classification?.quote}"`,
      bias: tertiary_classification
        ? `Political Bias: ${tertiary_classification.type.replace('_', ' ')}\nQuote: "${tertiary_classification.quote}"`
        : '',
    };
    return textMap[sectionKey] || '';
  };

  const renderConfidence = (modelConfidence, llmConfidence, llmReason, llmPositive) => {
    const hasLLM = llmConfidence != null;
    const hasReason = !!llmReason;

    if (!hasLLM && !hasReason) return null;

    const toPct = (v) => Math.round((v ?? 0) * 100);

    return (
      <div className="text-sm text-gray-500 dark:text-gray-400 mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600/50">
        {hasLLM && (
          <div className="flex items-center justify-between">
            <span className="font-medium">CheckMatic Confidence:</span>
            <div className="flex items-center space-x-3">
              <div className="relative w-24 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                <div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${toPct(llmConfidence)}%` }}
                />
              </div>
              <span className="font-semibold text-gray-800 dark:text-gray-200 min-w-[3rem] text-right">
                {toPct(llmConfidence)}%
              </span>
            </div>
          </div>
        )}

        {hasReason && (
          <div className="mt-4">
            <div
              className={`p-4 rounded-xl text-sm border transition-all duration-300 ${llmPositive
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
                }`}
            >
              <p className="leading-relaxed">{llmReason}</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSection = (title, icon, content, sectionKey) => {
    const isExpanded = expandedSections[sectionKey];

    return (
      <div className="mb-6 last:mb-0">
        <div className="group flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600/50 hover:bg-gray-100 dark:hover:bg-gray-700/70 hover:border-gray-200 dark:hover:border-gray-600 transition-all duration-300 ease-out">
          <button
            onClick={() => toggleSection(sectionKey)}
            className="flex items-center flex-1 text-left"
          >
            <div className="p-3 rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-600/50 transition-all duration-300 group-hover:shadow-md">
              {icon}
            </div>
            <h3 className="text-xl font-semibold ml-4 text-gray-800 dark:text-gray-200 transition-colors duration-300">
              {title}
            </h3>
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => copyToClipboard(getSectionText(sectionKey), sectionKey)}
              className="p-2.5 rounded-xl text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white dark:hover:bg-gray-800"
              title="Copy section"
            >
              {copiedSection === sectionKey ? (
                <FaClipboardCheck className="h-5 w-5 text-green-500" />
              ) : (
                <FaCopy className="h-5 w-5" />
              )}
            </button>
            <button
              onClick={() => toggleSection(sectionKey)}
              className="p-2.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-all duration-300 hover:bg-white dark:hover:bg-gray-800"
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              <FaChevronDown
                className={`h-5 w-5 transition-transform duration-500 ease-out ${isExpanded ? 'rotate-180' : ''
                  }`}
              />
            </button>
          </div>
        </div>

        <div
          className={`overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] ${isExpanded
            ? 'max-h-[800px] opacity-100 mt-4'
            : 'max-h-0 opacity-0'
            }`}
        >
          <div className="px-4">{content}</div>
        </div>
      </div>
    );
  };

  const getCredibilityIcon = () => {
    return primary_classification?.type === 'authentic' ? (
      <FaCheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <FaExclamationTriangle className="h-5 w-5 text-yellow-500" />
    );
  };

  const getCredibilityBadge = () => {
    const isAuthentic = primary_classification?.type === 'authentic';
    return (
      <span
        className={`font-bold capitalize px-3 py-1 rounded-full text-sm transition-all duration-300 ${isAuthentic
          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
          : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
          }`}
      >
        {primary_classification?.type?.replace('_', ' ')}
      </span>
    );
  };

  const getTypeBadge = () => {
    const isSatire = secondary_classification?.type === 'satire';
    return (
      <span
        className={`font-bold capitalize px-3 py-1 rounded-full text-sm transition-all duration-300 ${isSatire
          ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
          }`}
      >
        {secondary_classification?.type?.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div
      className={`w-full max-w-2xl mx-auto mt-8 dark:bg-indigo-900/20 transition-all duration-1000 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] ${animateIn
        ? 'translate-y-0 opacity-100 scale-100'
        : 'translate-y-12 opacity-0 scale-95'
        }`}
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden backdrop-blur-sm">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-indigo-50 dark:bg-indigo-900/20">
          <h2 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 flex items-center">
            <div className="p-3 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 mr-4 shadow-sm">
              <FaRegNewspaper className="h-6 w-6" />
            </div>
            Analysis Report
          </h2>

          <div className="flex items-center space-x-3">
            <button
              onClick={shareAnalysis}
              className="flex items-center space-x-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl transition-all duration-300 hover:shadow-md"
            >
              {copiedSection === 'share' ? (
                <>
                  <FaCheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-green-500 text-sm font-medium">Copied!</span>
                </>
              ) : (
                <>
                  <FaShare className="h-5 w-5" />
                  <span className="text-sm font-medium">Share</span>
                </>
              )}
            </button>

            <button
              onClick={toggleAllSections}
              className="px-3 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl transition-all duration-300 hover:shadow-md"
              title={Object.values(expandedSections).every(Boolean) ? 'Collapse all' : 'Expand all'}
            >
              <FaChevronDown
                className={`h-5 w-5 transition-transform duration-500 ease-out ${Object.values(expandedSections).every(Boolean) ? 'rotate-180' : ''
                  }`}
              />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Summary Section */}
          {renderSection(
            'Summary',
            <FaListAlt className="h-5 w-5 text-blue-600" />,
            <p className="text-lg text-gray-700 dark:text-gray-300 italic leading-relaxed">
              &quot;{summary}&quot;
            </p>,
            'summary'
          )}

          {/* Credibility Section */}
          {renderSection(
            'Credibility',
            getCredibilityIcon(),
            <div>
              <p className="text-lg mb-4">
                This article is likely {getCredibilityBadge()}
              </p>

              {renderConfidence(
                primary_classification?.model_confidence ?? null,
                primary_classification?.llm_confidence ?? null,
                primary_classification?.llm_reason ?? '',
                primary_classification?.llm_positive ?? false
              )}

              <blockquote className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/30 border-l-4 border-indigo-500 rounded-r-xl italic text-gray-600 dark:text-gray-400 leading-relaxed">
                &quot;{primary_classification?.quote}&quot;
              </blockquote>
            </div>,
            'credibility'
          )}

          {/* Type Section */}
          {renderSection(
            'Type',
            <FaRegNewspaper className="h-5 w-5 text-blue-500" />,
            <div>
              <p className="text-lg mb-4">
                It appears to be {getTypeBadge()}
              </p>

              {renderConfidence(
                secondary_classification?.model_confidence ?? null,
                secondary_classification?.llm_confidence ?? null,
                secondary_classification?.llm_reason ?? '',
                secondary_classification?.llm_positive ?? false
              )}

              <blockquote className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/30 border-l-4 border-purple-500 rounded-r-xl italic text-gray-600 dark:text-gray-400 leading-relaxed">
                &quot;{secondary_classification?.quote}&quot;
              </blockquote>
            </div>,
            'type'
          )}

          {/* Political Bias Section */}
          {tertiary_classification &&
            renderSection(
              'Political Bias',
              <FaBalanceScale className="h-5 w-5 text-indigo-600" />,
              <div>
                <p className="text-lg mb-4">
                  The article has a{' '}
                  <span className="font-bold capitalize px-3 py-1 rounded-full text-sm bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 transition-all duration-300">
                    {tertiary_classification.type.replace('_', ' ')}
                  </span>{' '}
                  bias.
                </p>

                {renderConfidence(
                  tertiary_classification?.model_confidence ?? null,
                  tertiary_classification?.llm_confidence ?? null,
                  tertiary_classification?.llm_reason ?? '',
                  tertiary_classification?.llm_positive ?? false
                )}

                <blockquote className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/30 border-l-4 border-indigo-500 rounded-r-xl italic text-gray-600 dark:text-gray-400 leading-relaxed">
                  &quot;{tertiary_classification.quote}&quot;
                </blockquote>
              </div>,
              'bias'
            )}
        </div>
        <div className="flex flex-col mt-1 mb-4 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>CheckMatic can make mistakes</p>
          <p>Use this analysis as a guide and verify the information</p>
        </div>
      </div>
    </div>
  );
}