import React from 'react';
import styled, { css, keyframes } from 'styled-components';
import { GlobalStyles } from '@/features/components';
import { useSubscriptionReport } from '@/features/hooks';
import { theme } from '@/features/theme';
import type { SubscriptionService, SubscriptionUsage } from '@/core';

/* ── Animations ── */

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const blink = keyframes`
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.2; }
`;

/* ── Header ── */

const Header = styled.header`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 14px;
  height: 46px;
  background: ${theme.colors.background};
  border-bottom: 1px solid ${theme.colors.border};
  flex-shrink: 0;
`;

const LogoBadge = styled.div`
  width: 22px;
  height: 22px;
  border-radius: 6px;
  background: ${theme.colors.gradient};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: 800;
  color: #fff;
  letter-spacing: -0.5px;
  flex-shrink: 0;
`;

const LogoText = styled.span`
  font-size: 13px;
  font-weight: 700;
  color: ${theme.colors.textPrimary};
  letter-spacing: -0.2px;
  flex: 1;
`;

const Timestamp = styled.span`
  font-size: 11px;
  color: ${theme.colors.textMuted};
`;

const RefreshBtn = styled.button<{ $spinning: boolean }>`
  width: 28px;
  height: 28px;
  border-radius: 7px;
  border: 1px solid ${theme.colors.border};
  background: transparent;
  color: ${theme.colors.textSecondary};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  line-height: 1;
  flex-shrink: 0;
  transition: border-color 0.15s, color 0.15s;

  ${({ $spinning }) =>
    $spinning &&
    css`
      animation: ${spin} 0.7s linear infinite;
      pointer-events: none;
      opacity: 0.4;
    `}

  &:hover {
    border-color: ${theme.colors.primary};
    color: ${theme.colors.primary};
  }
`;

/* ── Summary strip ── */

const SummaryStrip = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  border-bottom: 1px solid ${theme.colors.border};
`;

const SummaryCell = styled.div<{ $right?: boolean }>`
  padding: 11px 14px;
  border-right: ${({ $right }) => ($right ? 'none' : `1px solid ${theme.colors.border}`)};
`;

const SummaryLabel = styled.p`
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: ${theme.colors.textMuted};
  margin: 0 0 3px;
`;

const SummaryValue = styled.p<{ $color?: string }>`
  font-size: 20px;
  font-weight: 700;
  color: ${({ $color }) => $color ?? theme.colors.textPrimary};
  margin: 0;
  font-variant-numeric: tabular-nums;
  line-height: 1;
`;

/* ── Sections ── */

const Section = styled.section`
  & + & {
    border-top: 1px solid ${theme.colors.border};
  }
`;

const SectionHead = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px 6px;
`;

const SectionLabel = styled.span`
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: ${theme.colors.textMuted};
`;

const SectionBadge = styled.span`
  font-size: 10px;
  font-weight: 600;
  color: ${theme.colors.textMuted};
  background: ${theme.colors.border};
  padding: 1px 6px;
  border-radius: 99px;
`;

/* ── Service row ── */

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 14px;
  transition: background 0.1s;

  &:hover {
    background: ${theme.colors.surface};
  }
`;

const Monogram = styled.div<{ $bg: string; $fg: string }>`
  width: 30px;
  height: 30px;
  border-radius: 7px;
  background: ${({ $bg }) => $bg};
  color: ${({ $fg }) => $fg};
  font-size: 10px;
  font-weight: 700;
  letter-spacing: -0.3px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const RowInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const RowName = styled.p`
  font-size: 13px;
  font-weight: 600;
  color: ${theme.colors.textPrimary};
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const RowMeta = styled.p`
  font-size: 11px;
  color: ${theme.colors.textMuted};
  margin: 1px 0 0;
`;

const RowCost = styled.p<{ $red?: boolean }>`
  font-size: 13px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: ${({ $red }) => ($red ? theme.colors.error : theme.colors.textPrimary)};
  margin: 0;
  white-space: nowrap;
  flex-shrink: 0;
`;

/* ── Savings nudge ── */

const SavingsNudge = styled.div`
  padding: 11px 14px;
  background: ${theme.colors.warningBg};
  border-top: 1px solid rgba(217, 119, 6, 0.15);
  font-size: 12px;
  color: ${theme.colors.warning};
  line-height: 1.5;
`;

/* ── Empty / Loading ── */

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 44px 20px;
  gap: 8px;
  text-align: center;
`;

const EmptyTitle = styled.p`
  font-size: 14px;
  font-weight: 700;
  color: ${theme.colors.textPrimary};
  margin: 0;
`;

const EmptySub = styled.p`
  font-size: 12px;
  color: ${theme.colors.textSecondary};
  margin: 0;
  line-height: 1.6;
  max-width: 270px;
`;

const Dots = styled.div`
  display: flex;
  gap: 6px;
  align-items: center;
  margin-bottom: 4px;
`;

const LoadingDot = styled.span<{ $i: number }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${theme.colors.primary};
  animation: ${blink} 1.1s ease-in-out infinite;
  animation-delay: ${({ $i }) => $i * 0.18}s;
`;

/* ── Helpers ── */

// Soft palette: [background, foreground]
const PALETTE: [string, string][] = [
  ['#EEF2FF', '#3730A3'],
  ['#FEE2E2', '#991B1B'],
  ['#D1FAE5', '#065F46'],
  ['#FEF3C7', '#92400E'],
  ['#E0F2FE', '#075985'],
  ['#F3E8FF', '#5B21B6'],
  ['#FFE4E6', '#9F1239'],
  ['#ECFDF5', '#047857'],
];

function serviceMonogram(name: string): { initials: string; bg: string; fg: string } {
  const words = name.trim().split(/\s+/);
  const initials =
    words.length >= 2
      ? (words[0][0] + words[1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();
  const idx =
    name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % PALETTE.length;
  return { initials, bg: PALETTE[idx][0], fg: PALETTE[idx][1] };
}

function formatTimeAgo(ts: number | null): string {
  if (!ts) return 'never';
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  const hrs = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  return `${days}d ago`;
}

function formatUpdated(ts: number): string {
  const diff = Date.now() - ts;
  const secs = Math.floor(diff / 1_000);
  const mins = Math.floor(diff / 60_000);
  if (secs < 10) return 'just now';
  if (mins < 1) return `${secs}s ago`;
  if (mins < 60) return `${mins}m ago`;
  return new Date(ts).toLocaleTimeString();
}

/* ── Component ── */

export const TabPage: React.FC = () => {
  const { report, loading, refresh } = useSubscriptionReport();

  const activeServices = report
    ? report.services.filter((s) => report.usage[s.id]?.status === 'active')
    : [];

  const unusedServices = report
    ? report.services.filter((s) => {
        const u = report.usage[s.id];
        return u?.status === 'unused' && u?.lastVisit !== null;
      })
    : [];

  return (
    <>
      <GlobalStyles />

      {/* Header */}
      <Header>
        <LogoBadge>CC</LogoBadge>
        <LogoText>ClawCancel</LogoText>
        {report && <Timestamp>{formatUpdated(report.lastUpdated)}</Timestamp>}
        <RefreshBtn
          $spinning={loading}
          onClick={refresh}
          disabled={loading}
          aria-label="Refresh"
        >
          ↻
        </RefreshBtn>
      </Header>

      {/* States */}
      {loading && !report ? (
        <EmptyState>
          <Dots>
            <LoadingDot $i={0} />
            <LoadingDot $i={1} />
            <LoadingDot $i={2} />
          </Dots>
          <EmptyTitle>Loading…</EmptyTitle>
        </EmptyState>
      ) : !report ? (
        <EmptyState>
          <EmptyTitle>Tracking started</EmptyTitle>
          <EmptySub>
            ClawCancel is monitoring your subscriptions in the background. Your first
            report will appear after 30 days.
          </EmptySub>
        </EmptyState>
      ) : (
        <>
          {/* Summary */}
          <SummaryStrip>
            <SummaryCell>
              <SummaryLabel>Monthly</SummaryLabel>
              <SummaryValue>${report.totalCost.toFixed(2)}</SummaryValue>
            </SummaryCell>
            <SummaryCell $right>
              <SummaryLabel>Wasted</SummaryLabel>
              <SummaryValue $color={report.wastedCost > 0 ? theme.colors.error : theme.colors.textMuted}>
                {report.wastedCost > 0 ? `$${report.wastedCost.toFixed(2)}` : '—'}
              </SummaryValue>
            </SummaryCell>
          </SummaryStrip>

          {/* Active subscriptions */}
          {activeServices.length > 0 && (
            <Section>
              <SectionHead>
                <SectionLabel>Using</SectionLabel>
                <SectionBadge>{activeServices.length}</SectionBadge>
              </SectionHead>
              {activeServices.map((service) => {
                const usage = report.usage[service.id];
                const { initials, bg, fg } = serviceMonogram(service.name);
                return (
                  <Row key={service.id}>
                    <Monogram $bg={bg} $fg={fg}>{initials}</Monogram>
                    <RowInfo>
                      <RowName>{service.name}</RowName>
                      <RowMeta>Last used {formatTimeAgo(usage?.lastVisit ?? null)}</RowMeta>
                    </RowInfo>
                    <RowCost>${service.cost.toFixed(2)}/mo</RowCost>
                  </Row>
                );
              })}
            </Section>
          )}

          {/* Unused subscriptions */}
          {unusedServices.length > 0 && (
            <Section>
              <SectionHead>
                <SectionLabel>Not using</SectionLabel>
                <SectionBadge>{unusedServices.length}</SectionBadge>
              </SectionHead>
              {unusedServices.map((service: SubscriptionService) => {
                const usage: SubscriptionUsage | undefined = report.usage[service.id];
                const { initials, bg, fg } = serviceMonogram(service.name);
                return (
                  <Row key={service.id}>
                    <Monogram $bg={bg} $fg={fg}>{initials}</Monogram>
                    <RowInfo>
                      <RowName>{service.name}</RowName>
                      <RowMeta>
                        {usage?.lastVisit
                          ? `Last used ${formatTimeAgo(usage.lastVisit)}`
                          : 'Never used'}
                      </RowMeta>
                    </RowInfo>
                    <RowCost $red>${service.cost.toFixed(2)}/mo</RowCost>
                  </Row>
                );
              })}
            </Section>
          )}

          {/* No data yet */}
          {activeServices.length === 0 && unusedServices.length === 0 && (
            <EmptyState>
              <EmptyTitle>No data yet</EmptyTitle>
              <EmptySub>
                Browse your subscription services and ClawCancel will begin tracking usage.
              </EmptySub>
            </EmptyState>
          )}

          {/* Savings nudge */}
          {report.wastedCost > 0 && (
            <SavingsNudge>
              Cancel {report.unusedCount} unused subscription
              {report.unusedCount !== 1 ? 's' : ''} — save{' '}
              <strong>${report.wastedCost.toFixed(2)}/mo</strong> ($
              {(report.wastedCost * 12).toFixed(0)}/yr)
            </SavingsNudge>
          )}
        </>
      )}
    </>
  );
};
