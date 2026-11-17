'use client';

import {
  Visibility as VisibilityIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import RowActions from '../common/RowActions';

/**
 * Manuscript table actions: view and edit stay visible, everything else goes
 * into the "more" menu (see common/RowActions).
 *
 * menuItems: [{ key, label, icon, onClick, danger? }]
 */
export default function ManuscriptRowActions({
  onView,
  onEdit,
  canEdit = true,
  viewLabel = 'View details',
  editLabel = 'Edit manuscript',
  menuItems = [],
}) {
  const actions = [];
  if (onView) actions.push({ key: 'view', label: viewLabel, icon: <VisibilityIcon fontSize="small" />, onClick: onView });
  if (onEdit) actions.push({ key: 'edit', label: editLabel, icon: <EditIcon fontSize="small" />, onClick: onEdit, disabled: !canEdit });
  return <RowActions actions={actions} menuItems={menuItems} />;
}
