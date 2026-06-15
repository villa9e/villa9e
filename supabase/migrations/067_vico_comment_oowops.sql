-- Keep vico_governance_comments.oowop_count in sync with
-- vico_governance_comment_oowops rows (toggle from the proposal detail page).

CREATE OR REPLACE FUNCTION sync_vico_comment_oowops() RETURNS TRIGGER AS $$
DECLARE v_comment_id UUID := COALESCE(NEW.comment_id, OLD.comment_id);
BEGIN
  UPDATE vico_governance_comments
    SET oowop_count = (SELECT count(*) FROM vico_governance_comment_oowops WHERE comment_id = v_comment_id)
    WHERE id = v_comment_id;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_vico_comment_oowops ON vico_governance_comment_oowops;
CREATE TRIGGER trg_sync_vico_comment_oowops
  AFTER INSERT OR DELETE ON vico_governance_comment_oowops
  FOR EACH ROW EXECUTE FUNCTION sync_vico_comment_oowops();
