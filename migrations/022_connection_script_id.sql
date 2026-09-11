-- ---------------------------------------------------------------------------
-- 022_connection_script_id.sql — the credential that runs actions, not just
-- proves a connection happened.
--
-- pulse_connection.viasocket_id (012) is the auth_id the connect popup hands
-- back — enough to know somebody connected, not enough to do anything with
-- their mailbox. Running a Gmail action needs the script_id ViaSocket returns
-- from POST /embed/enable/:serviceId/:authId, which is why it gets its own
-- column rather than overloading viasocket_id: the two are fetched at
-- different times (auth_id on connect, script_id right after, from a second
-- call) and a failure of the second must not be mistaken for the first.
-- ---------------------------------------------------------------------------

ALTER TABLE pulse_connection
  ADD COLUMN script_id VARCHAR(190) NULL COMMENT 'ViaSocket script id — the credential actions run with' AFTER viasocket_id;
