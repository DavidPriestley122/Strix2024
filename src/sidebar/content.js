export const content = {
  "about-strix": {
    "what-is-strix": {
      title: "What is Strix?",
      body: "Strix is a 3D chess-like game featuring rod-like pieces representing birds: Owls, Kites, and Ravens. It is played on three checkerboards at right angles to each other. The game combines strategy, spatial awareness, and diplomacy as three players compete to move their Owl to the central nest.",
    },
    "game-history": {
      title: "History of Strix",
      body: "Strix, the brainchild of David Priestley, appeared in its earliest form in 1984. Over the subsequent years, he collaborated with his long-time schoolfriend Jonathan Moody to refine and develop the game. This unique board game has evolved through multiple iterations, each enhancing its strategic depth and player engagement.",
    },
  },
  gameplay: {
    "online-strix": {
      title: "3D Interface Guide",
      body: "To interact with the Strix game board, use your mouse to rotate the view. Left-click on a piece to select it, and then click on a valid destination square to move. The board can be rotated to view all three faces. Hover over pieces to see their possible moves. The central nest is highlighted for easy identification.",
    },
    "official-rules": {
      title: "Official Rules",
      body: `
        <p>The official rules for Strix are available as a PDF document, exactly as they appear in the printed booklet included with the physical game.</p>
        <p><a href="assets/The Rules of Strix.pdf" target="_blank" class="rules-link">View Strix Rules (PDF)</a></p>
      `,
    },
    "board-notation": {
      title: "Board Notation",
      body: "The Strix board notation system uses letters to denote faces (B for Brown, Y for Yellow, G for Green) followed by coordinates. For example, 'B3-5' refers to the square on the Brown face, 3rd row, 5th column. Moves are written as start-end, e.g., 'B7-1 to B6-2'. Special moves like ghosting are noted with 'gh', e.g., 'B7-1 gh Y1-7'.",
    },

    "sample-games": {
      title: "Sample Games",
      body: `
         <div class="sample-game">
          <h2>SAMPLE GAME 1</h2>
          <p>Sample Game 1. Played under Standard Strix rules.</p>
          <h3>Notation:</h3>
          <ul>
            <li>[Player][Piece]-[Destination Square]</li>
            <li>Players: b = Brown, y = Yellow, g = Green</li>
            <li>Pieces: O = Owl, K = Kite, R = Raven</li>
          </ul>
          <div class="game-moves">
<p><strong>1.1 bR-y31 </strong> This prevents 1.2. yK &ndash; g25, making a pivot for yO to ghost around, as 2.1 bR-y51 would mob yK from the board.</p>
<p><strong>1.2 yR-g31 </strong> Yellow deploys the same opening move, with similar thinking, but with respect to Green.</p>
<p><strong>1.3 gR-b31 </strong>For Green the move is less powerful, as the threat of mobbing the succeeding player&rsquo;s Kite in the same way as Brown and Yellow did is no longer available. However, it does prevent Brown&rsquo;s Owl heading for the nest with 2.1 bO&ndash;b72. This opening type is called &ldquo;All Ravens to the Forest Edge&rdquo;.</p>
<br>
<p><strong>2.1 bR-y32 </strong>Brown wishes to dislodge gR, but to do so would entail a two-move operation with bK, moving bK first to a square on Yellow&rsquo;s face and then back to b32. However, moving bK from its position would allow 2.2 yK-g26, giving sight of the nest to Yellow&rsquo;s Owl. To forestall this, Brown moves bR one square to block yK.</p>
<p><strong>2.2 yR-g32 </strong>Although there is no immediate cause for moving to this square, Yellow deems it prudent for yR to be blocking any future move by gK to b26, which would give nest sight to gO. ,</p>
<p><strong>2.3 gO-g72 </strong>Green anticipates 3.3 gR-b35, providing an axle for gO to ghost around. This might appear dangerous, as gR-b35 would leave gR en prise from yR, but Green calculates that Yellow will have more things to worry about by then.</p>
<br>
<p><strong>3.1 bR-b13! </strong>Brown spots that moving his Raven to this square will give him a choice of mobbing gO or gK, nudging Green to move his Raven away from its threatening position.</p>
<p><strong>3.2 yK-g25? </strong>Yellow makes its move, calculating that the head start it will gain by this will offset the probable loss of its Raven by 3.3 gR-b33xyR. A risky move.</p>
<p><strong>3.3 gR-b33 </strong>xyR As predicted, Green takes Yellow&rsquo;s Raven. Green notes that Brown can stop Yellow reaching the Nest by first making a pivot with 4.1 bK-y25 and then ghosting inwards, interposing Brown&rsquo;s Owl between Yellow&rsquo;s Owl and the nest. This absolves Green of the obligation to block Yellow&rsquo;s approach to the nest.</p>
<br>
<p><strong>4.1 bK-y25 </strong>The move is forced, anticipating 4.2 bO-g67. There is no other way to block Yellow gaining the nest. This puts bK en prise to gK on Green&rsquo;s next move, but Green cannot in fact take bK as it would allow bO to ghost into the nest- or would constitute a Third Bird Foul if Yellow called it out.</p>
<p><strong>4.2 yO-b67 </strong>Yellow has sight of the nest.</p>
<p><strong>4.3 gR-b35 </strong>Green cannot stop Yellow but sees that Brown must stop Yellow&rsquo;s move into the nest, so takes advantage by making a pivot for his Owl.</p>
<br>
<p><strong>5.1 bO-g67 </strong>Brown&rsquo;s Owl ghosts into this square, blocking yO and gaining sight of the nest.</p>
<p><strong>5.2 yK- g45 </strong>Yellow cannot stop bO so leaves it to Green. In the meantime, Yellow decides to cause as much damage as possible, attacking bK.</p>
<p><strong>5.3 gO-y27 </strong>Green has two ghosting options, inwards and outwards. The former leads to an immediate victory by Brown. This second, less obvious option keeps bO away from the nest without the risk of it ghosting into the nest.</p>
<br>
<p><strong>6.1 (a) bK-g55xyK? </strong>It looks like Yellow miscalculated, losing yK; but Brown did not notice that with gO ghosted away, Yellow can ghost to victory. Green calls a Third Bird Foul on Brown for letting Yellow win. It is a straightforward blunder and is acknowledged by all. Brown undoes the last move, using one of the allocated takebacks.</p>
<p><strong>6.1 (b) bR-b17 </strong>This blocks yO&rsquo;s ghost into the nest.</p>
<p><strong>6.2 yK-b53 </strong>Yellow could take Brown&rsquo;s Kite, heaping further punishment on Brown for the foul of Preparation, but decides to attack gO, thinking that after gO moves, Yellow will still be able to take bK, and from a better square, that will also threaten bO the move after.</p>
<p><strong>6.3 gK-b23 </strong>Green must defend the Owl from yK and the Kite from bR; this move accomplishes both.</p>
<br>
<p><strong>7.1 </strong>bK-y65 Brown moves the Kite out of danger from yK and threatens yO.</p>
<p><strong>7.2 yK-b51 </strong>Yellow cannot defend the Owl, so threatens gO, hoping that Brown &ndash; for some reason - will not take yO on Brown&rsquo;s next turn.</p>
<p><strong>7.3 gK-b21 </strong>Green must defend the Owl but cannot move or bO will walk into the Nest. This is the only option.</p>
<br>
<p><strong>8.1 bK-b66 x yO </strong>Brown takes Yellow&rsquo;s Owl. Yellow&rsquo;s Kite can no longer make moves.</p>
<p><strong> 8.2 gR-b36 </strong>Green would like to make a pivot, but more urgently must stop Brown doing the same.</p>
<br>
<p><strong> 9.1 bR-b16 </strong>Brown wants to give the Owl two ways to enter the Nest, and still has eyes for gO.</p>
<p><strong> 9.2 gR-b37 </strong>Green sees the most immediate threat is bO-y76 and blocks it.</p>
<br>
<p><stong> 10.1 bK-b65 </strong>Brown must get the Kite and Raven on different files, to be able to make a pivot.</p>
<p><strong> 10.2 gO-y37 </strong>Green can see no good move with the Kite, so moves the Owl to safety.</p>
<br>
<p><strong> 11.1 bR-y67 </strong>Brown is making a pivot for the Owl.</p>
<p><strong> 11.2 gR-y73 </strong>Green&rsquo;s Raven blocks bO&rsquo;s ghosting into the Nest.</p>
<br>
<p><strong> 12.1 bO-y76 </strong>Brown&rsquo;s Owl is one away from the Nest.</p>
<p><strong> 12.2 gR-y72 </strong>Green affords Brown the courtesy of gaining the Nest, rather than resigning.</p>
<br>
<p><strong>13.1 bO-y77 </strong>Brown moves into the Nest and Wins.</p>
</div>
</div>
`,
    },

    "two-player-variant": {
      title: "Two-Player Strix",
      body: `
        <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;line-height:115%;font-size:16px;font-family:"Aptos",sans-serif;'><strong><span style="font-size:13px;line-height:115%;">TWO PLAYER STRIX&nbsp;</span></strong></p>
        <p style='margin-right:0cm;margin-left:0cm;font-size:16px;font-family:"Times New Roman",serif;'>TWO-PLAYER STRIX</p>
        <p style='margin-right:0cm;margin-left:0cm;font-size:16px;font-family:"Times New Roman",serif;'>STRIX was conceived and is best played as a game for three players. However, several two-player variants of the game exist. The following describes the variant that most closely approximates the three-player game:</p>
        <p style='margin-right:0cm;margin-left:0cm;font-size:16px;font-family:"Times New Roman",serif;'>Starting Position and Basic Rules:</p>
        <ul style="list-style-type: disc;margin-left:26px;">
            <li>The starting position is the same as for three-player STRIX.</li>
            <li>The powers of the pieces, the object of the game, and the rules for the Nest and blocking remain unchanged.</li>
        </ul>
        <p style='margin-right:0cm;margin-left:0cm;font-size:16px;font-family:"Times New Roman",serif;'>New Restrictions:</p>
        <div style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;line-height:115%;font-size:16px;font-family:"Aptos",sans-serif;'>
            <ul style="margin-bottom:0cm;list-style-type: disc;margin-left:26px;">
                <li style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;line-height:115%;font-size:16px;font-family:"Aptos",sans-serif;'>Green's Owl – since Green is not an active player - may not be moved into the Nest.</li>
            </ul>
        </div>
        <p style='margin-right:0cm;margin-left:0cm;font-size:16px;font-family:"Times New Roman",serif;'>Gameplay:</p>
        <ul style="list-style-type: disc;margin-left:26px;">
            <li>Brown and Yellow move alternately, with Brown playing first.</li>
            <li>A player can move any of their own pieces or choose to move one of Green's pieces.</li>
            <li>Green's pieces are treated as common property.</li>
            <li>If a player moves one of Green's pieces, that specific piece becomes unavailable for both players on their next turns.</li>
        </ul>
        <p style='margin-top:0cm;margin-right:0cm;margin-bottom:8.0pt;margin-left:0cm;line-height:115%;font-size:16px;font-family:"Aptos",sans-serif;'><strong><span style="font-size:13px;line-height:115%;">&nbsp;</span></strong></p>
      `,
    },
  },

  quill: {
    "strix-lore": {
      title: "Strix Lore",
      body: "This is where Strix comes alive. Stories, poems, however the Muse inspires you. This is where to post it.",
    },
    parliament: {
      title: "Parliament",
      body: "Thoughts, comments, reviews; ideas for improvements: this is where to post them.",
    },
  },
  gallery: {
    "strix-sightings": {
      title: "Sightings of Strix",
      body: `
        <p>Strix in a medieval study</p>
          <a href="images/StrixInSolarUnsaturated.jpg" class="lightbox-image">
          <img src="images/StrixInSolarUnsaturated.jpg" alt="Strix in Solar" style="max-width: 100%; height: auto; margin-top: 15px;">
         </a>
        <p></p>
        `,
    },
  },

  shop: {
    purchase: {
      title: "Order Game Sets",
      body: "Strix game sets are currently in limited production. Each set includes a handcrafted 3D board, 9 beautifully designed pieces (3 each of Owls, Kites, and Ravens), and a comprehensive rulebook. Sets are available in classic wood or a modern acrylic version. Pre-order now to reserve your copy of this unique strategy game!",
    },
  },
};
