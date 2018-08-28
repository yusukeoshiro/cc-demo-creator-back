web: bin/rails server -p $PORT -e $RAILS_ENV
worker: ./ssh_agent_script && bundle exec sidekiq -C config/sidekiq.yml
