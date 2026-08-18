import { courseReportFixture } from '../data/courseReportFixture';
import {
  selectFilteredFindings,
  selectFindingsBySection,
  selectFindingsForItem,
  selectLocationLabel,
  selectModuleLocationLabel,
} from './findingsSelectors';

describe('findingsSelectors', () => {
  const noFilters = { severityFilters: [], typeFilters: [], selectedItemId: null };

  it('selectFindingsForItem returns only findings for the given item_id', () => {
    const findings = selectFindingsForItem(courseReportFixture, 'comp-welcome-video');
    expect(findings).toHaveLength(1);
    expect(findings[0].id).toBe('run-2026-07-15-ds101:comp-welcome-video:0');
  });

  it('selectFilteredFindings with no filters returns every finding', () => {
    const findings = selectFilteredFindings(courseReportFixture, noFilters);
    expect(findings).toHaveLength(courseReportFixture.findings.length);
  });

  it('selectFilteredFindings filters by severity (union of selected pills)', () => {
    const findings = selectFilteredFindings(courseReportFixture, {
      ...noFilters,
      severityFilters: ['Critical', 'High'],
    });
    expect(findings.every((f) => f.severity === 'Critical' || f.severity === 'High')).toBe(true);
    expect(findings).toHaveLength(2);
  });

  it('selectFilteredFindings filters by selectedItemId', () => {
    const findings = selectFilteredFindings(courseReportFixture, {
      ...noFilters,
      selectedItemId: 'comp-welcome-video',
    });
    expect(findings).toHaveLength(1);
    expect(findings[0].item_id).toBe('comp-welcome-video');
  });

  it('selectLocationLabel resolves a component finding to "section · item"', () => {
    const finding = courseReportFixture.findings.find((f) => f.item_id === 'comp-welcome-video')!;
    expect(selectLocationLabel(courseReportFixture, finding)).toBe(
      'Introduction to Data Science · Welcome Video',
    );
  });

  it('selectLocationLabel falls back to the raw item_id when unresolvable', () => {
    const finding = { ...courseReportFixture.findings[0], item_id: 'does-not-exist' };
    expect(selectLocationLabel(courseReportFixture, finding)).toBe('does-not-exist');
  });

  it('selectModuleLocationLabel surfaces subsection/unit context without repeating the section', () => {
    const finding = courseReportFixture.findings.find((f) => f.item_id === 'unit-intro-python')!;
    expect(selectModuleLocationLabel(courseReportFixture, finding)).toBe('Tools of the Trade · Setting Up Python');
  });

  it('selectFindingsBySection groups findings by owning section, excluding unresolvable ones', () => {
    const bySection = selectFindingsBySection(courseReportFixture);
    // sec-intro owns comp-welcome-video, unit-intro-python, and comp-python-problem's findings.
    expect(bySection['sec-intro']).toHaveLength(3);
    // sec-stats owns comp-mean-html's finding plus its own section-level finding.
    expect(bySection['sec-stats']).toHaveLength(2);
  });
});
