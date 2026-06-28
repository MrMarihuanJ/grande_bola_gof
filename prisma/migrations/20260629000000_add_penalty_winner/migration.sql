-- AlterTable: Add penaltyWinner column to Bet table
ALTER TABLE "Bet" ADD COLUMN "penaltyWinner" TEXT;

-- AlterTable: Add phase column to Match table if not exists (idempotent via DO block)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'Match' AND column_name = 'phase'
  ) THEN
    ALTER TABLE "Match" ADD COLUMN "phase" TEXT NOT NULL DEFAULT 'groups';
  END IF;
END $$;

-- CreateIndex on phase if not exists
CREATE INDEX IF NOT EXISTS "Match_phase_idx" ON "Match"("phase");
CREATE INDEX IF NOT EXISTS "Match_phase_matchNum_idx" ON "Match"("phase", "matchNum");
