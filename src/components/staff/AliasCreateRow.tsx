import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useCreateTagAliasMutation } from '../../store/services/tagAliasApi';
import { addAlert } from '../../store/slices/alertSlice';
import { getApiErrorMessage } from '../../utils/apiError';
import { Button } from '../ui';

/**
 * The alias table's create row. A refused create alerts with the api's
 * message (#456): a 409 can mean the alias exists, or that `badTag` names an
 * official tag (#365), so no one reason is assumed.
 */
const AliasCreateRow = () => {
  const dispatch = useDispatch();
  const [badTag, setBadTag] = useState('');
  const [goodTag, setGoodTag] = useState('');
  const [createTagAlias, { isLoading: creating }] = useCreateTagAliasMutation();

  const handleCreate = async () => {
    try {
      await createTagAlias({
        badTag: badTag.trim(),
        goodTag: goodTag.trim()
      }).unwrap();
      setBadTag('');
      setGoodTag('');
    } catch (err) {
      dispatch(
        addAlert(
          getApiErrorMessage(err) ?? 'Failed to create the alias.',
          'danger'
        )
      );
    }
  };

  return (
    <tr data-st="row">
      <td>
        <input
          data-st="field"
          className="w-full"
          placeholder="e.g. hip-hop"
          value={badTag}
          onChange={(e) => setBadTag(e.target.value)}
        />
      </td>
      <td>
        <input
          data-st="field"
          className="w-full"
          placeholder="e.g. hip.hop"
          value={goodTag}
          onChange={(e) => setGoodTag(e.target.value)}
        />
      </td>
      <td>
        <span className="text-xs text-[var(--st-text-faint)]">
          Canonical tag must exist
        </span>
      </td>
      <td className="text-right">
        <Button
          variant="primary"
          disabled={creating || !badTag || !goodTag}
          onClick={handleCreate}
        >
          {creating ? 'Adding…' : 'Add alias'}
        </Button>
      </td>
    </tr>
  );
};

export default AliasCreateRow;
