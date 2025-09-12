#!/bin/bash

# Orchestrator Management Script
# Advanced process management with PM2

ORCHESTRATOR_DIR="/Users/davicho/MASTER proyectos/Orchestrator"
PM2_CONFIG="ecosystem.config.js"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[i]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Function to check if PM2 is installed
check_pm2() {
    if ! command -v pm2 &> /dev/null; then
        print_error "PM2 is not installed. Installing now..."
        npm install -g pm2
        if [ $? -eq 0 ]; then
            print_status "PM2 installed successfully"
        else
            print_error "Failed to install PM2"
            exit 1
        fi
    else
        print_status "PM2 is installed"
    fi
}

# Change to orchestrator directory
cd "$ORCHESTRATOR_DIR" || exit 1

case "$1" in
    start)
        print_info "Starting Orchestrator System..."
        check_pm2
        pm2 start $PM2_CONFIG
        pm2 save
        print_status "Orchestrator system started"
        pm2 status
        ;;
    
    stop)
        print_info "Stopping Orchestrator System..."
        pm2 stop all
        print_status "All agents stopped"
        ;;
    
    restart)
        print_info "Restarting Orchestrator System..."
        pm2 restart all
        print_status "All agents restarted"
        pm2 status
        ;;
    
    reload)
        print_info "Gracefully reloading Orchestrator System..."
        pm2 reload all
        print_status "All agents reloaded"
        ;;
    
    status)
        print_info "Orchestrator System Status:"
        pm2 status
        echo ""
        print_info "Memory Usage:"
        pm2 monit
        ;;
    
    logs)
        if [ -z "$2" ]; then
            print_info "Showing logs for all agents..."
            pm2 logs
        else
            print_info "Showing logs for $2..."
            pm2 logs "$2"
        fi
        ;;
    
    monitor)
        print_info "Opening PM2 Monitor Dashboard..."
        pm2 monit
        ;;
    
    startup)
        print_info "Setting up auto-start on system boot..."
        pm2 startup
        pm2 save
        print_status "Auto-start configured"
        ;;
    
    unstartup)
        print_info "Removing auto-start configuration..."
        pm2 unstartup
        print_status "Auto-start removed"
        ;;
    
    delete)
        print_warning "Removing all agents from PM2..."
        pm2 delete all
        print_status "All agents removed"
        ;;
    
    reset)
        print_warning "Resetting all agent metadata..."
        pm2 reset all
        print_status "Metadata reset"
        ;;
    
    scale)
        if [ -z "$2" ] || [ -z "$3" ]; then
            print_error "Usage: $0 scale <app-name> <instances>"
            exit 1
        fi
        print_info "Scaling $2 to $3 instances..."
        pm2 scale "$2" "$3"
        print_status "Scaling completed"
        ;;
    
    info)
        if [ -z "$2" ]; then
            print_error "Usage: $0 info <app-name>"
            exit 1
        fi
        pm2 describe "$2"
        ;;
    
    list)
        pm2 list
        ;;
    
    flush)
        print_warning "Flushing all log files..."
        pm2 flush
        print_status "Logs flushed"
        ;;
    
    web)
        print_info "Starting PM2 Web Dashboard on port 9615..."
        pm2 web
        print_status "Web dashboard available at http://localhost:9615"
        ;;
    
    update)
        print_info "Updating PM2..."
        pm2 update
        print_status "PM2 updated"
        ;;
    
    install)
        print_info "Installing PM2 modules..."
        pm2 install pm2-logrotate
        pm2 set pm2-logrotate:max_size 10M
        pm2 set pm2-logrotate:retain 7
        pm2 set pm2-logrotate:compress true
        print_status "PM2 modules installed and configured"
        ;;
    
    health)
        print_info "System Health Check:"
        echo "------------------------"
        
        # Check each agent
        for app in orchestrator data-processor file-manager monitor research; do
            status=$(pm2 jlist | jq -r ".[] | select(.name==\"$app\") | .pm2_env.status")
            if [ "$status" = "online" ]; then
                print_status "$app is running"
            else
                print_error "$app is not running"
            fi
        done
        
        echo ""
        print_info "Resource Usage:"
        pm2 jlist | jq -r '.[] | "\(.name): Memory: \(.monit.memory / 1024 / 1024 | floor)MB, CPU: \(.monit.cpu)%"'
        ;;
    
    quickstart)
        print_info "Quick Start - Launching all agents..."
        check_pm2
        pm2 start $PM2_CONFIG
        pm2 save
        pm2 startup
        print_status "Orchestrator system fully deployed"
        pm2 status
        echo ""
        print_info "Management commands:"
        echo "  ./orchestrator.sh status  - Check status"
        echo "  ./orchestrator.sh logs    - View logs"
        echo "  ./orchestrator.sh monitor - Open monitor"
        echo "  ./orchestrator.sh stop    - Stop all agents"
        ;;
    
    *)
        echo "Orchestrator Management System"
        echo "==============================="
        echo ""
        echo "Usage: $0 {command} [options]"
        echo ""
        echo "Basic Commands:"
        echo "  start       - Start all agents"
        echo "  stop        - Stop all agents"
        echo "  restart     - Restart all agents"
        echo "  reload      - Graceful reload (zero-downtime)"
        echo "  status      - Show agent status"
        echo "  quickstart  - Quick setup and start"
        echo ""
        echo "Monitoring Commands:"
        echo "  logs [name] - View logs (all or specific agent)"
        echo "  monitor     - Open monitoring dashboard"
        echo "  health      - System health check"
        echo "  info <name> - Detailed info about an agent"
        echo "  list        - List all processes"
        echo "  web         - Start web dashboard"
        echo ""
        echo "Management Commands:"
        echo "  scale <name> <n> - Scale agent instances"
        echo "  startup          - Configure auto-start on boot"
        echo "  unstartup        - Remove auto-start"
        echo "  delete           - Remove all agents from PM2"
        echo "  reset            - Reset agent metadata"
        echo "  flush            - Clear all log files"
        echo "  update           - Update PM2"
        echo "  install          - Install PM2 modules"
        echo ""
        echo "Examples:"
        echo "  $0 start"
        echo "  $0 logs data-processor"
        echo "  $0 scale research 3"
        exit 1
        ;;
esac

exit 0