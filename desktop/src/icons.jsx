/**
 * App icon set: Phosphor Icons (MIT, https://phosphoricons.com).
 * Navigation and section icons use the two-tone "duotone" weight, actions use
 * "bold" so they hold up at button size. Pre-weighted wrappers work anywhere a
 * component is expected (Astryx Icon, SideNavItem, TextInput startIcon).
 */

import {
  ArrowRightIcon,
  ArrowSquareOutIcon,
  ArrowsClockwiseIcon,
  CaretDownIcon,
  ChartPieSliceIcon,
  CheckCircleIcon,
  DownloadSimpleIcon,
  FilesIcon,
  FolderOpenIcon,
  FolderPlusIcon,
  FolderSimpleIcon,
  FunctionIcon,
  GearSixIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  SparkleIcon,
  TrashIcon,
  WarningIcon,
  XIcon,
} from '@phosphor-icons/react';

function withWeight(Component, weight, name) {
  const Weighted = (props) => <Component weight={weight} {...props} />;
  Weighted.displayName = name;
  return Weighted;
}

// Navigation and section headings
export const NewAnalysisIcon = withWeight(FolderPlusIcon, 'duotone', 'NewAnalysisIcon');
export const OverviewIcon = withWeight(ChartPieSliceIcon, 'duotone', 'OverviewIcon');
export const FilesNavIcon = withWeight(FilesIcon, 'duotone', 'FilesNavIcon');
export const FunctionsIcon = withWeight(FunctionIcon, 'duotone', 'FunctionsIcon');
export const AIIcon = withWeight(SparkleIcon, 'duotone', 'AIIcon');
export const SettingsIcon = withWeight(GearSixIcon, 'duotone', 'SettingsIcon');
export const ProjectIcon = withWeight(FolderSimpleIcon, 'duotone', 'ProjectIcon');
export const PrivacyIcon = withWeight(ShieldCheckIcon, 'duotone', 'PrivacyIcon');
export const WarnIcon = withWeight(WarningIcon, 'duotone', 'WarnIcon');
export const CheckIcon = withWeight(CheckCircleIcon, 'fill', 'CheckIcon');

// Actions
export const PickFolderIcon = withWeight(FolderOpenIcon, 'bold', 'PickFolderIcon');
export const RevealIcon = withWeight(FolderOpenIcon, 'bold', 'RevealIcon');
export const RefreshIcon = withWeight(ArrowsClockwiseIcon, 'bold', 'RefreshIcon');
export const ExportIcon = withWeight(DownloadSimpleIcon, 'bold', 'ExportIcon');
export const NextIcon = withWeight(ArrowRightIcon, 'bold', 'NextIcon');
export const SearchIcon = withWeight(MagnifyingGlassIcon, 'bold', 'SearchIcon');
export const CloseIcon = withWeight(XIcon, 'bold', 'CloseIcon');
export const OpenExternalIcon = withWeight(ArrowSquareOutIcon, 'bold', 'OpenExternalIcon');
export const ClearIcon = withWeight(TrashIcon, 'bold', 'ClearIcon');
export const ExpandIcon = withWeight(CaretDownIcon, 'bold', 'ExpandIcon');
export const AIActionIcon = withWeight(SparkleIcon, 'fill', 'AIActionIcon');
