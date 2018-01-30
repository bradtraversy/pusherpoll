const form = document.getElementById('vote-form');

// Form Submit Event
form.addEventListener('submit', e => {
  // check Local Storage to see if `hasVoted` key already stored
  if(window.localStorage.getItem('hasVoted')) {
    $('#hasVotedAlreadyErrorMsg').removeClass('hidden');
    e.preventDefault();
  } else {
    // set Local Storage to show the user has voted already
    window.localStorage.setItem('hasVoted', true)

    const choice = document.querySelector('input[name=os]:checked').value;
    const data = { os: choice };

    fetch('http://localhost:3000/poll', {
      method: 'post',
      body: JSON.stringify(data),
      headers: new Headers({
        'Content-Type': 'application/json'
      })
    })
      .then(res => res.json())
      .then(data => console.log(data))
      .catch(err => console.log(err));
      e.preventDefault();
  }
});

fetch('http://localhost:3000/poll')
  .then(res => res.json())
  .then(data => {
    const votes = data.votes;
    const totalVotes = votes.length;
    document.querySelector('#chartTitle').textContent = `Total Votes: ${totalVotes}`;

    // Refresh the Total Votes every 2 seconds
    setInterval(() => {
      fetch('http://localhost:3000/poll')
        .then(res => res.json())
        .then(data => document.querySelector('#chartTitle').textContent = `Total Votes: ${data.votes.length}`)
        .catch(err => console.log(err));
    }, 2000);

    // Count vote points - acc/current
    const voteCounts = votes.reduce(
      (acc, vote) => (
        (acc[vote.os] = (acc[vote.os] || 0) + parseInt(vote.points)), acc
      ),
      {}
    );

    // Set initial Data Points
    if (Object.keys(voteCounts).length === 0 && voteCounts.constructor === Object) {
      voteCounts.Windows = 0;
      voteCounts.MacOS = 0;
      voteCounts.Linux = 0;
      voteCounts.Other = 0;
    }

    let dataPoints = [
      { label: 'Windows', y: voteCounts.Windows },
      { label: 'MacOS', y: voteCounts.MacOS },
      { label: 'Linux', y: voteCounts.Linux },
      { label: 'Other', y: voteCounts.Other }
    ];

    const chartContainer = document.querySelector('#chartContainer');

    if (chartContainer) {
      const chart = new CanvasJS.Chart('chartContainer', {
        animationEnabled: true,
        theme: 'theme1',
        data: [
          {
            type: 'column',
            dataPoints: dataPoints
          }
        ]
      });
      chart.render();

      // Enable pusher logging - don't include this in production
      Pusher.logToConsole = true;

      var pusher = new Pusher('55a3916fa22efde02378', {
        cluster: 'us2',
        encrypted: true
      });

      var channel = pusher.subscribe('os-poll');
      channel.bind('os-vote', function(data) {
        dataPoints = dataPoints.map(x => {
          if (x.label == data.os) {
            x.y += data.points;
            return x;
          } else {
            return x;
          }
        });
        chart.render();
      });
    }
  });
