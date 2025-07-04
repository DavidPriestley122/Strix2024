# Strix Game Export Format Examples

This document shows examples of the different export formats available for Strix games.

## SGN Format (Strix Game Notation)

Similar to chess PGN format, this is the recommended format for sharing and archiving games:

```
[Event "Strix Game"]
[Site "Strix2024"]
[Date "2024.07.04"]
[Round "1"]
[Brown "Human"]
[Yellow "Computer"]
[Green "Human"]
[Result "Brown wins"]
[StartTime "14:30:25"]
[EndTime "14:45:12"]
[Duration "14:47"]
[Moves "23"]

1. bO-b72
2. yK-g25 x yR
3. gO-g71
4. bR-b53 x gK
5. yO-y74
6. restore bR
7. bO-b77 (Brown wins)
```

### SGN Format Features:
- **Header metadata** with game details
- **Numbered moves** for easy reference
- **Capture notation** using 'x' separator
- **Special moves** like 'restore' commands
- **Result notation** at the end
- **Compact but readable** format

## Simple Text Format

Human-readable format for casual sharing:

```
=== STRIX GAME RECORD ===
Date: 2024.07.04
Time: 14:30:25
Players: Brown(Human), Yellow(Computer), Green(Human)
Result: Brown wins

=== MOVES ===
1. bO-b72
2. yK-g25 x yR
3. gO-g71
4. bR-b53 x gK
5. yO-y74
6. restore bR
7. bO-b77 (Brown wins)
```

### Text Format Features:
- **Simple header** with basic game info
- **Easy to read** and share via text
- **No special formatting** required
- **Good for emails** or text messages

## JSON Format

Structured format for programmatic use:

```json
{
  "metadata": {
    "event": "Strix Game",
    "site": "Strix2024",
    "date": "2024.07.04",
    "startTime": "2024-07-04T14:30:25.000Z",
    "endTime": "2024-07-04T14:45:12.000Z",
    "duration": 887000,
    "players": {
      "brown": "Human",
      "yellow": "Computer",
      "green": "Human"
    },
    "result": "Brown wins",
    "moveCount": 7
  },
  "moves": [
    {
      "moveNumber": 1,
      "notation": "bO-b72",
      "piece": "brownOwl",
      "from": "b7-1",
      "to": "b7-2",
      "captured": null,
      "type": "move"
    },
    {
      "moveNumber": 2,
      "notation": "yK-g25 x yR",
      "piece": "yellowKite",
      "from": "y6-2",
      "to": "g2-5",
      "captured": "yellowRaven",
      "type": "move"
    },
    {
      "moveNumber": 7,
      "notation": "Brown wins",
      "type": "result"
    }
  ],
  "finalPosition": {
    "brownOwl": "b7-7",
    "brownKite": "b6-2",
    "brownRaven": "b5-3",
    "yellowOwl": "y7-1",
    "yellowKite": "g2-5",
    "yellowRaven": "captured",
    "greenOwl": "g7-1",
    "greenKite": "captured",
    "greenRaven": "g5-3"
  },
  "captureHistory": [
    {
      "moveIndex": 1,
      "text": "yR captured"
    },
    {
      "moveIndex": 3,
      "text": "gK captured"
    }
  ]
}
```

### JSON Format Features:
- **Complete game data** with all details
- **Structured format** for parsing
- **Move-by-move details** including positions
- **Final board state** included
- **Capture history** tracked
- **Ideal for analysis** and replay

## Move Notation Reference

### Basic Move Format
- `bO-b72` - Brown Owl moves to square b72
- `yK-g25` - Yellow Kite moves to square g25
- `gR-b31` - Green Raven moves to square b31

### Capture Notation
- `bO-b72 x yR` - Brown Owl moves to b72 and captures Yellow Raven
- `yK-g25 x gO x bR` - Yellow Kite moves to g25 and captures Green Owl and Brown Raven

### Special Commands
- `restore bR` - Restore Brown Raven from Owl Halla
- `x yO` - Direct capture of Yellow Owl (without moving)

### Piece Abbreviations
- **Colors**: `b` (brown), `y` (yellow), `g` (green)
- **Pieces**: `O` (Owl), `K` (Kite), `R` (Raven)

### Square Notation
- Format: `[color][row][column]`
- Examples: `b72` (brown board, row 7, column 2), `y34` (yellow board, row 3, column 4)

## Usage

The export system supports:
1. **Copy to clipboard** - Copy game in selected format
2. **Save to file** - Download game as .sgn, .txt, or .json file
3. **Format selection** - Choose between SGN, Text, or JSON formats
4. **Automatic metadata** - Tracks game timing, players, and results

## File Extensions

- `.sgn` - Strix Game Notation files
- `.txt` - Simple text format files  
- `.json` - JSON format files

These formats ensure that Strix games can be easily shared, archived, and analyzed using the most appropriate format for each use case.