# Enemy Specification: The Piano Man

**Created**: 2026-07-17  
**Status**: Draft  
**Enemy Type**: Full boss enemy  
**Design Intent**: Mid-to-high difficulty control boss  
**Primary Mechanic**: Tempo Meter phase rotation

## Summary

The Piano Man is a piano-bar boss built around explicit lounge-singalong homage:
late-night regulars, a harmonica sting, a smoky upright piano, and a room that
starts cheering against the players when the rhythm takes over. The design should
feel immediately recognizable as a piano-bar pop-culture parody while using
original copy, original ability names, and no quoted lyrics.

The boss wins by controlling tempo instead of dealing the highest raw damage. He
disrupts player action points, changes the cost of common actions, and punishes
teams that let the fight reach Last Call without coordinating Guard, Heal, and
Charge choices.

## Boss Catalog Entry

| Field | Value |
| --- | --- |
| `name` | `The Piano Man` |
| `description` | `A late-night lounge legend whose haunted piano turns every round into a sing-along trap.` |
| `baseHealth` | `30` |
| `baseActionPointsPerRound` | `3` |
| `defaultSpriteRef` | `null` until a dedicated sprite is available |
| `status` | `draft` until implementation and balance validation are complete |

### Scaling Profile

| Field | Value |
| --- | --- |
| `healthPerPlayer` | `3` |
| `actionPointsPerPlayerThreshold` | `4` |
| `bonusActionPoints` | `1` |

This places The Piano Man near Iron Cathedral Revenant durability while giving
him more baseline action pressure. His damage should remain moderate because his
control effects can deny or tax player turns.

## Visual Direction

- Upright piano with exaggerated ivory keys and brass trim.
- Lounge suit, loosened tie, and stage spotlight silhouette.
- Harmonica glint or short harmonica animation during phase changes.
- Animated crowd silhouettes behind the boss that brighten as Tempo rises.
- Avoid real-person likeness, album artwork, venue names, and lyric text.

## Tempo Meter

The Tempo Meter tracks the boss's performance state across battle exchanges.
Each active exchange has exactly one Tempo phase.

| Phase | Trigger | Gameplay Effect |
| --- | --- | --- |
| `Verse` | Default opening phase | Boss uses light disruption and builds Tempo. |
| `Chorus` | Tempo reaches 2 | The next player Attack costs +1 AP unless the party used Guard this exchange. |
| `Last Call` | Tempo reaches 4 or boss health drops below 35% | Boss performs a heavy control action, then Tempo resets to 1. |

### Tempo Rules

- The fight starts in `Verse` with Tempo `0`.
- The boss gains `+1 Tempo` after each boss action that damages or disrupts at
  least one player.
- The boss gains `+1 Tempo` when no player uses Guard during an exchange.
- The boss loses `1 Tempo` when at least two players spend AP on Charge during
  the same exchange.
- `Last Call` may trigger at most once per quiz round.
- Tempo state persists between battle exchanges, but not after the encounter
  ends.

## Boss Abilities

### Opening Number

**Cost**: 1 boss AP  
**Phase**: `Verse`  
**Target**: One player  
**Effect**: Deal 2 damage and reduce the target's current AP by 1, to a minimum
of 0.

Use this as the default low-cost disruption action. It gives the boss something
meaningful to do without overwhelming small rooms.

### Tip Jar Tax

**Cost**: 2 boss AP  
**Phase**: `Verse` or `Chorus`  
**Target**: All players with at least 1 AP  
**Effect**: Each target must pay 1 AP or take 2 damage.

This creates a clear tension between conserving AP for offense and preserving
party health. The UI should summarize the result as AP paid, damage taken, or no
effect.

### Everybody Knows The Chorus

**Cost**: 2 boss AP  
**Phase**: `Chorus`  
**Target**: Party-wide rule modifier  
**Effect**: Until the end of the current exchange, the first player Attack costs
+1 AP. If any player used Guard before player attacks resolve, prevent this AP
increase.

This phase makes defensive coordination valuable without fully locking players
out of attacking.

### Play It Again

**Cost**: 3 boss AP  
**Phase**: `Chorus`  
**Target**: Previous player action type  
**Effect**: The most recently used player action type costs +1 AP for the next
player who attempts it this exchange.

If no player action has been resolved yet this encounter, the boss should choose
another valid action instead.

### Last Call Refrain

**Cost**: 3 boss AP  
**Phase**: `Last Call`  
**Target**: All active players  
**Effect**: Deal 3 damage to each active player. Players with 0 AP take +1
damage. Reset Tempo to 1 after this action resolves.

This is the boss's marquee pressure moment. It should be announced clearly on the
host display before resolution so the room understands why the exchange spiked.

## Targeting Priority

When boss actions and targets are automated, The Piano Man should follow this
priority order:

1. Prefer `Last Call Refrain` when `Last Call` is active and the action is
   affordable.
2. Prefer `Everybody Knows The Chorus` when `Chorus` is active, players have
   enough AP to attack, and no Guard has been declared.
3. Prefer `Tip Jar Tax` when at least half of active players have 1 or more AP.
4. Prefer `Play It Again` when the previous player action type is known and at
   least one remaining player can afford that action.
5. Use `Opening Number` against the active player with the highest AP.

Tie-breakers should use the existing random tie behavior from the game loop.

## Player Counterplay

- Guard reduces the value of `Everybody Knows The Chorus`.
- Charge can lower Tempo when at least two players coordinate it in one exchange.
- Heal is strongest after `Last Call Refrain`, especially for players who spent
  AP before the spike.
- Attacks remain viable, but repeated Attack-heavy turns become inefficient once
  `Play It Again` begins taxing the same action type.

## Host And Player Readability

- The host battle arena should show the current Tempo phase near The Piano Man's
  health and AP.
- Player action screens should show temporary AP cost changes before the player
  confirms an action.
- Between-round summaries should list Tempo phase changes and AP disruption in
  plain language.
- The phase names should appear exactly as `Verse`, `Chorus`, and `Last Call`.

## Acceptance Criteria

1. Given the host selects The Piano Man for an encounter, when the battle starts,
   then the boss enters the fight with the configured health, AP, and Tempo `0`.
2. Given The Piano Man completes a disrupting boss action, when the action
   resolves, then Tempo increases by 1 unless a specific ability rule resets it.
3. Given the party reaches Tempo `2`, when the next exchange begins, then The
   Piano Man enters `Chorus`.
4. Given the party reaches Tempo `4` or The Piano Man drops below 35% health,
   when Last Call has not already triggered this quiz round, then The Piano Man
   enters `Last Call`.
5. Given `Last Call Refrain` resolves, when damage is applied, then active
   players with 0 AP take the extra damage and Tempo resets to 1.
6. Given a temporary AP cost modifier is active, when a player chooses actions,
   then the UI shows the modified cost before the player confirms the action.
7. Given at least two players Charge in the same exchange, when the exchange
   resolves, then Tempo decreases by 1 to a minimum of 0.

## Balance Risks

- AP denial can feel worse than damage if the UI does not explain why an action
  became unaffordable.
- `Tip Jar Tax` should not fire repeatedly against very small groups unless the
  boss has earned enough AP through scaling.
- `Last Call Refrain` should be limited to once per quiz round to avoid repeated
  party-wide spikes.
- The homage should stay playful and original in shipped text, with no lyrics,
  real-person likeness, or direct song excerpts.

## Implementation Notes

- The current boss catalog supports reusable boss definitions but does not yet
  model custom phase state or per-boss AI rules in the schema.
- The likely implementation needs either a boss behavior metadata field or a
  code-owned behavior registry keyed by boss definition name or stable slug.
- Tempo should be persisted on the active boss combatant or encounter extension
  state so it survives between exchanges.
- AP cost modifiers need to be visible in both action validation and player UI
  affordability checks.
- Add focused tests for Tempo transitions, Last Call frequency, AP-cost
  modifiers, and boss action priority.
