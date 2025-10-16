import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';

const dayKey = (iso) => (iso ? moment(iso).format('YYYY-MM-DD') : 'unscheduled');
const dayLabel = (key) => (key === 'unscheduled' ? 'Unscheduled' : moment(key).format('MMMM D, YYYY'));

const ReleaseNotesSidebar = ({ notes }) => {
  const groups = useMemo(() => {
    const map = new Map();
    (notes || []).forEach((n) => {
      const key = dayKey(n.published_at);
      if (!map.has(key)) { map.set(key, []); }
      map.get(key).push(n);
    });
    // Sort groups by date desc, unscheduled last
    const keys = Array.from(map.keys()).sort((a, b) => {
      if (a === 'unscheduled') { return 1; }
      if (b === 'unscheduled') { return -1; }
      return moment(b).valueOf() - moment(a).valueOf();
    });
    return keys.map((k) => ({ key: k, label: dayLabel(k), items: map.get(k) }));
  }, [notes]);

  return (
    <aside className="release-notes-sidebar">
      <div className="m-0 p-0">
        {groups.map((g) => (
          <div key={g.key} className="mb-3">
            <p className="mb-1">{g.label}</p>
            <ul className="list-unstyled m-0 p-0 ml-3">
              {g.items.map((n) => (
                <li key={n.id} className="mb-2">
                  <a href={`#note-${n.id}`} className="text-decoration-none">{n.title}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </aside>
  );
};

ReleaseNotesSidebar.propTypes = {
  notes: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string,
    published_at: PropTypes.string,
  })).isRequired,
};

export default ReleaseNotesSidebar;
